import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { generateInviteCode } from "./actions";

type InviteRow = {
  code: string;
  used_by: string | null;
  expires_at: string;
  created_at: string;
  profiles: { username: string } | null;
};

export default async function AdminInvitesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.id !== process.env.ADMIN_USER_ID) {
    redirect("/home");
  }

  const { data: codesRaw } = await supabase
    .from("invitation_codes")
    .select("code, used_by, expires_at, created_at, profiles!used_by(username)")
    .order("created_at", { ascending: false })
    .limit(50);

  const codes = (codesRaw ?? []) as unknown as InviteRow[];

  return (
    <div className="min-h-screen p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--gold)" }}>
        Panel de invitaciones
      </h1>
      <p className="text-muted-foreground text-sm mb-8">Solo visible para ti</p>

      <form action={generateInviteCode} className="mb-8">
        <button
          type="submit"
          className="rounded-md px-5 py-2 text-sm font-semibold"
          style={{ backgroundColor: "var(--gold)", color: "#0A0A0A" }}
        >
          Generar nuevo código
        </button>
      </form>

      <div className="space-y-2">
        {codes.map((c) => {
          const used = !!c.used_by;
          const expired = new Date(c.expires_at) < new Date();
          const profile = c.profiles;

          return (
            <div
              key={c.code}
              className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
            >
              <div>
                <span className="font-mono text-sm font-semibold">{c.code}</span>
                {used && profile && (
                  <span className="ml-3 text-xs text-muted-foreground">
                    usado por @{profile.username}
                  </span>
                )}
                {!used && expired && (
                  <span className="ml-3 text-xs text-destructive">expirado</span>
                )}
              </div>
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: used ? "var(--muted)" : expired ? "transparent" : "#F8BF3A22",
                  color: used ? "var(--muted-foreground)" : expired ? "var(--destructive)" : "var(--gold)",
                }}
              >
                {used ? "usado" : expired ? "expirado" : "disponible"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

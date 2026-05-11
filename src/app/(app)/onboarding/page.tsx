import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { completeOnboarding } from "./actions";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, onboarding_completed")
    .eq("id", user.id)
    .single();

  if (profile?.onboarding_completed) redirect("/home");

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--gold)" }}>
            Bienvenido a Filmedia
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Hola <strong>@{profile?.username}</strong>. Cuéntanos un poco sobre ti.
          </p>
        </div>

        <form action={completeOnboarding} className="space-y-5">
          <div>
            <label htmlFor="display_name" className="block text-sm font-medium mb-1">
              Nombre visible <span className="text-muted-foreground font-normal">(opcional)</span>
            </label>
            <input
              id="display_name"
              name="display_name"
              type="text"
              maxLength={50}
              className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground mt-1">Si lo dejas vacío se usará tu @usuario</p>
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium mb-1">
              Bio <span className="text-muted-foreground font-normal">(opcional)</span>
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={3}
              maxLength={160}
              className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>

          <div>
            <label htmlFor="avatar_url" className="block text-sm font-medium mb-1">
              URL de avatar <span className="text-muted-foreground font-normal">(opcional)</span>
            </label>
            <input
              id="avatar_url"
              name="avatar_url"
              type="url"
              placeholder="https://..."
              className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md py-2.5 text-sm font-semibold transition-colors"
            style={{ backgroundColor: "var(--gold)", color: "#0A0A0A" }}
          >
            Empezar a explorar
          </button>
        </form>
      </div>
    </div>
  );
}

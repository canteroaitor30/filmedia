import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--gold)" }}>
          Filmedia
        </h1>
        <p className="text-muted-foreground">
          Hola, <span className="text-foreground font-medium">{profile?.display_name ?? profile?.username}</span>
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          El catálogo y el resto de funcionalidades llegan pronto.
        </p>
      </div>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const [{ data: profile }, { count: unreadCount }] = await Promise.all([
    supabase.from("profiles").select("username, avatar_url").eq("id", user.id).single(),
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("read", false),
  ]);

  return (
    <div className="min-h-screen relative">
      <div
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{
          backgroundImage: "url('/fondo6.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          opacity: 0.08,
        }}
      />
      <Navbar username={profile?.username ?? "usuario"} avatarUrl={profile?.avatar_url ?? null} unreadNotifications={unreadCount ?? 0} />
      <main className="mx-auto max-w-7xl px-6 pt-20 pb-8">{children}</main>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const [{ data: profile }, { count: unreadCount }] = await Promise.all([
    supabase.from("profiles").select("username").eq("id", user.id).single(),
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("read", false),
  ]);

  return (
    <div className="min-h-screen">
      <Navbar username={profile?.username ?? "usuario"} unreadNotifications={unreadCount ?? 0} />
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}

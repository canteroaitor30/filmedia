import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CreateListButton } from "@/components/lists/CreateListButton";
import { ListVideo } from "lucide-react";

export default async function ListsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: lists } = await supabase
    .from("custom_lists")
    .select("id, title, description, privacy, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const PRIVACY_ICONS = { private: "🔒", followers: "👥", public: "🌍" };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Mis listas</h1>
        <CreateListButton />
      </div>

      {!lists?.length ? (
        <div className="text-center py-20 text-muted-foreground">
          <ListVideo size={48} className="mx-auto mb-3" style={{ color: "var(--gold)" }} />
          <p>Aún no tienes listas. ¡Crea una!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lists.map((list) => (
            <Link
              key={list.id}
              href={`/lists/${list.id}`}
              className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors"
            >
              <div>
                <p className="font-medium">{list.title}</p>
                {list.description && (
                  <p className="text-sm text-muted-foreground mt-0.5 truncate max-w-xs">{list.description}</p>
                )}
              </div>
              <span className="text-lg ml-4">{PRIVACY_ICONS[list.privacy as keyof typeof PRIVACY_ICONS]}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

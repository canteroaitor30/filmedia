import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CreateListButton } from "@/components/lists/CreateListButton";
import { ListVideo, Globe, Users, Lock } from "lucide-react";

const PRIVACY_ICONS = {
  private: <Lock size={12} />,
  followers: <Users size={12} />,
  public: <Globe size={12} />,
};

const PRIVACY_LABELS = {
  private: "Solo yo",
  followers: "Seguidores",
  public: "Público",
};

export default async function ListsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: lists } = await supabase
    .from("custom_lists")
    .select("id, title, description, privacy, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/50">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mis listas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Organiza tu contenido favorito</p>
        </div>
        <CreateListButton />
      </div>

      {!lists?.length ? (
        <div className="text-center py-20 text-muted-foreground">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5" style={{ backgroundColor: "color-mix(in srgb, var(--gold) 12%, transparent)" }}>
            <ListVideo size={28} style={{ color: "var(--gold)" }} />
          </div>
          <p className="font-semibold text-foreground text-lg mb-1.5">Sin listas todavía</p>
          <p className="text-sm max-w-xs mx-auto">Crea tu primera lista para organizar películas, series y anime</p>
        </div>
      ) : (
        <div className="space-y-2">
          {lists.map((list) => {
            const privacyKey = list.privacy as keyof typeof PRIVACY_ICONS;
            return (
              <Link
                key={list.id}
                href={`/lists/${list.id}`}
                className="group flex items-center justify-between p-4 rounded-xl border border-border/60 bg-card/40 hover:bg-card hover:border-border transition-all duration-150"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold group-hover:text-[var(--gold)] transition-colors truncate">{list.title}</p>
                  {list.description && (
                    <p className="text-sm text-muted-foreground mt-0.5 truncate">{list.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 ml-4 text-xs text-muted-foreground flex-shrink-0">
                  <span className="opacity-60">{PRIVACY_ICONS[privacyKey]}</span>
                  <span>{PRIVACY_LABELS[privacyKey]}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { tmdbMovies, tmdbSeries, posterUrl } from "@/lib/tmdb/client";
import { anilistAnime } from "@/lib/anilist/client";
import Link from "next/link";
import Image from "next/image";
import { AddToListButton } from "@/components/lists/AddToListButton";

export default async function ListDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: list } = await supabase
    .from("custom_lists")
    .select("id, title, description, privacy, user_id")
    .eq("id", id)
    .single();

  if (!list) notFound();

  const isOwn = list.user_id === user.id;

  const { data: items } = await supabase
    .from("custom_list_items")
    .select("media_type, external_id, position")
    .eq("list_id", id)
    .order("position");

  const enriched = await Promise.all(
    (items ?? []).map(async (item) => {
      try {
        if (item.media_type === "movie") {
          const m = await tmdbMovies.detail(item.external_id);
          return { ...item, title: m.title, poster: posterUrl(m.poster_path, "w185"), href: `/movies/${m.id}` };
        } else if (item.media_type === "series") {
          const s = await tmdbSeries.detail(item.external_id);
          return { ...item, title: s.name, poster: posterUrl(s.poster_path, "w185"), href: `/series/${s.id}` };
        } else {
          const a = await anilistAnime.detail(item.external_id);
          return { ...item, title: a.title.english ?? a.title.romaji, poster: a.coverImage.large, href: `/anime/${a.id}` };
        }
      } catch { return null; }
    })
  );

  const valid = enriched.filter(Boolean) as NonNullable<typeof enriched[0]>[];
  const PRIVACY_LABELS = { private: "Solo yo", followers: "Seguidores", public: "Público" };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">{list.title}</h1>
            {list.description && <p className="text-sm text-muted-foreground mt-1">{list.description}</p>}
            <p className="text-xs text-muted-foreground mt-1">
              {PRIVACY_LABELS[list.privacy as keyof typeof PRIVACY_LABELS]} · {valid.length} elementos
            </p>
          </div>
          <Link href="/lists" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
            ← Mis listas
          </Link>
        </div>
      </div>

      {!valid.length ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-4xl mb-3">📭</p>
          <p>Lista vacía. Añade contenido desde las fichas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
          {valid.map((item) => (
            <Link key={`${item.media_type}-${item.external_id}`} href={item.href} className="group">
              <div className="aspect-[2/3] rounded overflow-hidden bg-secondary relative">
                {item.poster
                  ? <Image src={item.poster} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform" sizes="120px" />
                  : <div className="flex items-center justify-center h-full text-xs text-muted-foreground p-1 text-center">{item.title}</div>
                }
              </div>
              <p className="text-xs mt-1 truncate text-muted-foreground">{item.title}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

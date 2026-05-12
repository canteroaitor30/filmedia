import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { tmdbMovies, tmdbSeries, posterUrl } from "@/lib/tmdb/client";
import { anilistAnime } from "@/lib/anilist/client";
import Link from "next/link";
import Image from "next/image";
import { AddToListButton } from "@/components/lists/AddToListButton";
import { ChevronLeft, Inbox, Globe, Users, Lock } from "lucide-react";

const PRIVACY_ICONS = {
  private: <Lock size={12} />,
  followers: <Users size={12} />,
  public: <Globe size={12} />,
};

const PRIVACY_LABELS = { private: "Solo yo", followers: "Seguidores", public: "Público" };

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
  const privacyKey = list.privacy as keyof typeof PRIVACY_LABELS;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link
          href="/lists"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5"
        >
          <ChevronLeft size={14} />
          Mis listas
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight">{list.title}</h1>
            {list.description && (
              <p className="text-sm text-muted-foreground mt-1">{list.description}</p>
            )}
            <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
              <span className="opacity-60">{PRIVACY_ICONS[privacyKey]}</span>
              <span>{PRIVACY_LABELS[privacyKey]}</span>
              <span className="text-muted-foreground/40">·</span>
              <span>{valid.length} elemento{valid.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>
      </div>

      {!valid.length ? (
        <div className="text-center py-20 text-muted-foreground">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ backgroundColor: "color-mix(in srgb, var(--gold) 10%, transparent)" }}>
            <Inbox size={24} style={{ color: "var(--gold)" }} />
          </div>
          <p className="font-semibold text-foreground mb-1.5">Lista vacía</p>
          <p className="text-sm">Añade contenido desde las fichas de películas, series y anime</p>
        </div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2.5">
          {valid.map((item) => (
            <Link key={`${item.media_type}-${item.external_id}`} href={item.href} className="group">
              <div className="aspect-[2/3] rounded-lg overflow-hidden bg-secondary relative shadow-md">
                {item.poster
                  ? <Image
                      src={item.poster}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="120px"
                    />
                  : <div className="flex items-center justify-center h-full text-xs text-muted-foreground p-1 text-center">{item.title}</div>
                }
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </div>
              <p className="text-xs mt-1.5 truncate text-muted-foreground group-hover:text-foreground transition-colors">{item.title}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

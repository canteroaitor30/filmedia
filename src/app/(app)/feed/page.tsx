import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { tmdbMovies, tmdbSeries, posterUrl } from "@/lib/tmdb/client";
import { anilistAnime } from "@/lib/anilist/client";
import type { MediaType, MediaStatus, Platform } from "@/types/database";
import Link from "next/link";
import Image from "next/image";
import { UsersRound, Star, Clock, BookmarkPlus } from "lucide-react";

type ActivityRow = {
  user_id: string;
  media_type: MediaType;
  external_id: number;
  status: MediaStatus;
  rating: number | null;
  platform: Platform | null;
  updated_at: string;
  profiles: { username: string; display_name: string | null; avatar_url: string | null } | null;
};

export default async function FeedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: following } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id);

  const followingIds = following?.map((f) => f.following_id) ?? [];

  if (!followingIds.length) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 text-muted-foreground">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5" style={{ backgroundColor: "color-mix(in srgb, var(--gold) 12%, transparent)" }}>
          <UsersRound size={28} style={{ color: "var(--gold)" }} />
        </div>
        <p className="font-semibold text-foreground text-lg mb-2">No sigues a nadie aún</p>
        <p className="text-sm max-w-xs mx-auto">Busca usuarios y síguelos para ver su actividad aquí</p>
      </div>
    );
  }

  const { data: activityRaw } = await supabase
    .from("user_media")
    .select("user_id, media_type, external_id, status, rating, platform, updated_at, profiles!user_id(username, display_name, avatar_url)")
    .in("user_id", followingIds)
    .order("updated_at", { ascending: false })
    .limit(40);

  const activity = (activityRaw ?? []) as unknown as ActivityRow[];

  const enriched = await Promise.all(
    activity.map(async (item) => {
      try {
        let title = "", poster: string | null = null, href = "";
        if (item.media_type === "movie") {
          const m = await tmdbMovies.detail(item.external_id);
          title = m.title; poster = posterUrl(m.poster_path, "w185"); href = `/movies/${m.id}`;
        } else if (item.media_type === "series") {
          const s = await tmdbSeries.detail(item.external_id);
          title = s.name; poster = posterUrl(s.poster_path, "w185"); href = `/series/${s.id}`;
        } else {
          const a = await anilistAnime.detail(item.external_id);
          title = a.title.english ?? a.title.romaji; poster = a.coverImage.large; href = `/anime/${a.id}`;
        }
        return { ...item, title, poster, href };
      } catch { return null; }
    })
  );

  const valid = enriched.filter(Boolean) as NonNullable<typeof enriched[0]>[];

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8 pb-4 border-b border-border/50">
        <h1 className="text-2xl font-bold tracking-tight">Actividad</h1>
        <p className="text-sm text-muted-foreground mt-1">Lo último de las personas que sigues</p>
      </div>

      {valid.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">Sin actividad reciente</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[18px] top-0 bottom-0 w-px bg-border/50" />

          <div className="space-y-0">
            {valid.map((item, i) => {
              const profile = item.profiles ?? { username: "usuario", display_name: null, avatar_url: null };
              const isWatched = item.status === "watched";
              const hasRating = isWatched && item.rating;

              return (
                <div key={i} className="relative flex gap-4 pb-6 pl-1">
                  {/* Timeline dot */}
                  <div className="relative z-10 flex-shrink-0">
                    <Link href={`/u/${profile.username}`}>
                      <div className="w-9 h-9 rounded-full bg-secondary flex-shrink-0 overflow-hidden flex items-center justify-center text-sm ring-2 ring-background">
                        {profile.avatar_url
                          ? <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                          : <img src="/perfil2.jpg" alt="Usuario" className="w-full h-full object-cover rounded-full" />
                        }
                      </div>
                    </Link>
                  </div>

                  {/* Card */}
                  <div className="flex-1 min-w-0 bg-card/60 border border-border/60 rounded-xl p-3.5 hover:border-border transition-colors">
                    {/* Action line */}
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <p className="text-sm leading-snug">
                        <Link href={`/u/${profile.username}`} className="font-semibold hover:underline">
                          {profile.display_name ?? profile.username}
                        </Link>
                        {" "}
                        <span className="text-muted-foreground">
                          {isWatched
                            ? hasRating ? "valoró" : "marcó como visto"
                            : "añadió a pendientes"
                          }
                        </span>
                      </p>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {hasRating && (
                          <span className="inline-flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--gold)", color: "#0A0A0A" }}>
                            <Star size={9} strokeWidth={3} />
                            {item.rating}
                          </span>
                        )}
                        {!isWatched && (
                          <BookmarkPlus size={13} className="text-muted-foreground" />
                        )}
                        {isWatched && !hasRating && (
                          <Clock size={13} className="text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Media row */}
                    <Link href={item.href} className="flex items-center gap-2.5 group">
                      {item.poster && (
                        <div className="w-10 h-14 rounded-md overflow-hidden bg-secondary flex-shrink-0 ring-1 ring-white/5">
                          <Image src={item.poster} alt={item.title} width={40} height={56} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="text-sm font-medium group-hover:text-[var(--gold)] transition-colors truncate block">{item.title}</span>
                        {item.platform && (
                          <p className="text-xs text-muted-foreground mt-0.5">{item.platform}</p>
                        )}
                      </div>
                    </Link>

                    <p className="text-xs text-muted-foreground/50 mt-2">
                      {new Date(item.updated_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

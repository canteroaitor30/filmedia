import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { tmdbMovies, tmdbSeries, posterUrl } from "@/lib/tmdb/client";
import { anilistAnime } from "@/lib/anilist/client";
import type { MediaType, MediaStatus, Platform } from "@/types/database";
import Link from "next/link";
import Image from "next/image";

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
        <p className="text-4xl mb-4">👥</p>
        <p className="font-medium text-foreground mb-2">No sigues a nadie aún</p>
        <p className="text-sm">Busca usuarios y síguelos para ver su actividad aquí</p>
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
    <div className="max-w-xl mx-auto space-y-4">
      <h1 className="text-xl font-bold mb-6">Actividad</h1>
      {valid.map((item, i) => {
        const profile = item.profiles ?? { username: "usuario", display_name: null, avatar_url: null };
        const action = item.status === "watched"
          ? item.rating ? `valoró con ${item.rating}★` : "marcó como visto"
          : "añadió a pendientes";

        return (
          <div key={i} className="flex gap-3 p-3 rounded-lg border border-border bg-card">
            <Link href={`/u/${profile.username}`}>
              <div className="w-9 h-9 rounded-full bg-secondary flex-shrink-0 overflow-hidden flex items-center justify-center text-sm">
                {profile.avatar_url
                  ? <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                  : <span className="text-muted-foreground">👤</span>
                }
              </div>
            </Link>
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <Link href={`/u/${profile.username}`} className="font-medium hover:underline">
                  {profile.display_name ?? profile.username}
                </Link>
                {" "}<span className="text-muted-foreground">{action}</span>
              </p>
              <Link href={item.href} className="flex items-center gap-2 mt-2 group">
                {item.poster && (
                  <div className="w-10 h-14 rounded overflow-hidden bg-secondary flex-shrink-0">
                    <Image src={item.poster} alt={item.title} width={40} height={56} className="object-cover w-full h-full" />
                  </div>
                )}
                <span className="text-sm font-medium group-hover:underline truncate">{item.title}</span>
              </Link>
              {item.platform && (
                <p className="text-xs text-muted-foreground mt-1">{item.platform}</p>
              )}
              <p className="text-xs text-muted-foreground/60 mt-1">
                {new Date(item.updated_at).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

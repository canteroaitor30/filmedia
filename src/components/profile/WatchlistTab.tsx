import { createClient } from "@/lib/supabase/server";
import { tmdbMovies, tmdbSeries, posterUrl } from "@/lib/tmdb/client";
import { anilistAnime } from "@/lib/anilist/client";
import type { MediaType, MediaStatus, Platform } from "@/types/database";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { WatchlistFilters } from "./WatchlistFilters";

interface Props {
  userId: string;
  isOwn: boolean;
  filters?: { type?: string; status?: string; rating?: string; platform?: string; genre?: string; year?: string };
}

export async function WatchlistTab({ userId, isOwn, filters = {} }: Props) {
  const supabase = await createClient();

  let query = supabase
    .from("user_media")
    .select("media_type, external_id, status, rating, platform")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (filters.type && filters.type !== "all") query = query.eq("media_type", filters.type as MediaType);
  if (filters.status && filters.status !== "all") query = query.eq("status", filters.status as MediaStatus);
  if (filters.rating && filters.rating !== "all") query = query.gte("rating", Number(filters.rating));
  if (filters.platform && filters.platform !== "all") query = query.eq("platform", filters.platform as Platform);

  const [{ data: rawItems }, { data: allItems }] = await Promise.all([
    query.limit(200),
    supabase.from("user_media").select("platform").eq("user_id", userId).not("platform", "is", null),
  ]);

  let items = rawItems ?? [];

  // Genre / year filtering via media_cache
  const needsCacheFilter = (filters.genre && filters.genre !== "all") || (filters.year && filters.year !== "all");
  let genres: string[] = [];
  let decades: string[] = [];

  if (items.length) {
    const byType: Record<string, number[]> = { movie: [], series: [], anime: [] };
    for (const i of items) byType[i.media_type]?.push(i.external_id);

    const cacheResults = await Promise.all(
      (["movie", "series", "anime"] as const).map((t) =>
        byType[t].length
          ? supabase.from("media_cache").select("external_id, genres, year").eq("media_type", t).in("external_id", byType[t])
          : Promise.resolve({ data: [] })
      )
    );

    const cacheMap = new Map<string, { genres: string[]; year: number | null }>();
    for (const { data } of cacheResults) {
      for (const row of (data ?? []) as { external_id: number; genres: string[]; year: number | null }[]) {
        const mediaType = cacheResults.indexOf(cacheResults.find(r => (r.data ?? []).includes(row))!) === 0 ? "movie" : cacheResults.indexOf(cacheResults.find(r => (r.data ?? []).includes(row))!) === 1 ? "series" : "anime";
        cacheMap.set(`${mediaType}-${row.external_id}`, { genres: row.genres, year: row.year });
      }
    }

    // Rebuild properly
    cacheMap.clear();
    const types = ["movie", "series", "anime"] as const;
    for (let ti = 0; ti < 3; ti++) {
      const t = types[ti];
      for (const row of (cacheResults[ti].data ?? []) as { external_id: number; genres: string[]; year: number | null }[]) {
        cacheMap.set(`${t}-${row.external_id}`, { genres: row.genres, year: row.year });
      }
    }

    // Build unique genres and decades for the filter UI
    const allGenres = new Set<string>();
    const allDecades = new Set<string>();
    for (const [, v] of cacheMap) {
      for (const g of (v.genres ?? [])) allGenres.add(g);
      if (v.year) allDecades.add(String(Math.floor(v.year / 10) * 10));
    }
    genres = [...allGenres].sort();
    decades = [...allDecades].sort((a, b) => Number(b) - Number(a));

    if (needsCacheFilter) {
      items = items.filter((item) => {
        const cached = cacheMap.get(`${item.media_type}-${item.external_id}`);
        if (!cached) return false;
        if (filters.genre && filters.genre !== "all" && !(cached.genres ?? []).includes(filters.genre)) return false;
        if (filters.year && filters.year !== "all" && cached.year) {
          const itemDecade = String(Math.floor(cached.year / 10) * 10);
          if (itemDecade !== filters.year) return false;
        }
        return true;
      });
    }
  }

  const platforms = [...new Set(
    (allItems ?? []).map((i: { platform: string | null }) => i.platform).filter(Boolean)
  )] as string[];

  const currentFilters = {
    type: filters.type ?? "",
    status: filters.status ?? "",
    rating: filters.rating ?? "",
    platform: filters.platform ?? "",
    genre: filters.genre ?? "",
    year: filters.year ?? "",
  };

  const filterBar = (
    <Suspense>
      <WatchlistFilters platforms={platforms} genres={genres} decades={decades} currentFilters={currentFilters} />
    </Suspense>
  );

  if (!items.length) {
    return (
      <div>
        {filterBar}
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-4xl mb-3">🎬</p>
          <p>{isOwn ? "Nada que mostrar con estos filtros" : "Sin contenido aún"}</p>
        </div>
      </div>
    );
  }

  const details = await Promise.all(
    items.map(async (item) => {
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

  const valid = details.filter(Boolean) as NonNullable<typeof details[0]>[];
  const watched = valid.filter((i) => i.status === "watched");
  const pending = valid.filter((i) => i.status === "pending");
  const activeCount = Object.values(filters).filter((v) => v && v !== "all").length;

  return (
    <div>
      {filterBar}
      {activeCount > 0 && (
        <p className="text-xs text-muted-foreground mb-4">{valid.length} resultado{valid.length !== 1 ? "s" : ""}</p>
      )}
      <div className="space-y-8">
        {filters.status !== "pending" && watched.length > 0 && (
          <section>
            <h2 className="text-base font-semibold mb-4">Vistos <span className="text-muted-foreground font-normal text-sm">({watched.length})</span></h2>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {watched.map((item) => (
                <Link key={`${item.media_type}-${item.external_id}`} href={item.href} className="group">
                  <div className="aspect-[2/3] rounded overflow-hidden bg-secondary relative">
                    {item.poster
                      ? <Image src={item.poster} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform" sizes="120px" />
                      : <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground p-1 text-center">{item.title}</div>
                    }
                    {item.rating && (
                      <div className="absolute bottom-1 right-1 text-xs font-bold rounded px-1" style={{ backgroundColor: "var(--gold)", color: "#0A0A0A" }}>
                        {item.rating}★
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
        {filters.status !== "watched" && pending.length > 0 && (
          <section>
            <h2 className="text-base font-semibold mb-4">Pendientes <span className="text-muted-foreground font-normal text-sm">({pending.length})</span></h2>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {pending.map((item) => (
                <Link key={`${item.media_type}-${item.external_id}`} href={item.href} className="group">
                  <div className="aspect-[2/3] rounded overflow-hidden bg-secondary relative">
                    {item.poster
                      ? <Image src={item.poster} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform" sizes="120px" />
                      : <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground p-1 text-center">{item.title}</div>
                    }
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

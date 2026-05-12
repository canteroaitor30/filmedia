import { tmdbMovies, tmdbSeries, posterUrl } from "@/lib/tmdb/client";
import { anilistAnime } from "@/lib/anilist/client";
import { createClient } from "@/lib/supabase/server";
import { MediaCard } from "@/components/media/MediaCard";
import type { UnifiedMedia } from "@/types/media";
import { Search, X, User } from "lucide-react";
import Link from "next/link";

interface Props {
  searchParams: Promise<{ q?: string; type?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const { q = "", type = "all" } = await searchParams;

  if (!q.trim()) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground gap-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "color-mix(in srgb, var(--gold) 10%, transparent)" }}>
          <Search size={28} style={{ color: "var(--gold)" }} />
        </div>
        <div className="text-center">
          <p className="font-semibold text-foreground">Busca lo que quieres ver</p>
          <p className="text-sm mt-1">Películas, series, anime o usuarios</p>
        </div>
      </div>
    );
  }

  const results: UnifiedMedia[] = [];
  const supabase = await createClient();

  const [usersRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
      .neq("username", "system")
      .limit(5),

    (type === "all" || type === "movie") &&
      tmdbMovies.search(q).then((r) =>
        results.push(...r.results.slice(0, 20).map((m) => ({
          id: m.id, type: "movie" as const,
          title: m.title, originalTitle: m.original_title,
          overview: m.overview, posterUrl: posterUrl(m.poster_path),
          backdropUrl: null,
          year: m.release_date ? new Date(m.release_date).getFullYear() : null,
          score: m.vote_average ? m.vote_average * 10 : null, genres: [],
        })))
      ).catch(() => {}),

    (type === "all" || type === "series") &&
      tmdbSeries.search(q).then((r) =>
        results.push(...r.results.slice(0, 20).map((s) => ({
          id: s.id, type: "series" as const,
          title: s.name, originalTitle: s.original_name,
          overview: s.overview, posterUrl: posterUrl(s.poster_path),
          backdropUrl: null,
          year: s.first_air_date ? new Date(s.first_air_date).getFullYear() : null,
          score: s.vote_average ? s.vote_average * 10 : null, genres: [],
        })))
      ).catch(() => {}),

    (type === "all" || type === "anime") &&
      anilistAnime.search(q).then((r) =>
        results.push(...r.media.map((a) => ({
          id: a.id, type: "anime" as const,
          title: a.title.english ?? a.title.romaji, originalTitle: a.title.native,
          overview: a.description, posterUrl: a.coverImage.large,
          backdropUrl: a.bannerImage,
          year: a.startDate.year, score: a.averageScore, genres: a.genres,
        })))
      ).catch(() => {}),
  ]);

  const users = usersRes.data ?? [];
  const typeLabels = { all: "Todo", movie: "Películas", series: "Series", anime: "Anime" };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-border/50">
        <div>
          <h1 className="text-xl font-semibold leading-tight">
            Resultados para{" "}
            <span className="font-bold" style={{ color: "var(--gold)" }}>&ldquo;{q}&rdquo;</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{results.length + users.length} resultado{results.length + users.length !== 1 ? "s" : ""}</p>
        </div>
        <a
          href="/home"
          className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:border-border transition-colors flex-shrink-0"
        >
          <X size={12} />
          Cancelar
        </a>
      </div>

      {/* Users */}
      {users.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Usuarios</p>
          <div className="flex flex-col gap-1">
            {users.map((u) => (
              <Link
                key={u.id}
                href={`/u/${u.username}`}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/60 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden ring-1 ring-white/10">
                  {u.avatar_url
                    ? <img src={u.avatar_url} alt={u.username} className="w-full h-full object-cover" />
                    : <User size={16} className="text-muted-foreground" />
                  }
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{u.display_name ?? u.username}</p>
                  <p className="text-xs text-muted-foreground">@{u.username}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Type filter pills */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "movie", "series", "anime"] as const).map((t) => (
          <a
            key={t}
            href={`/search?q=${encodeURIComponent(q)}&type=${t}`}
            className="px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={type === t
              ? { backgroundColor: "var(--gold)", color: "#0A0A0A", borderColor: "var(--gold)" }
              : { borderColor: "var(--border)", color: "var(--muted-foreground)" }}
          >
            {typeLabels[t]}
          </a>
        ))}
      </div>

      {results.length === 0 && users.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Search size={32} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium text-foreground">Sin resultados</p>
          <p className="text-sm mt-1">Prueba con otro término de búsqueda</p>
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
          {results.map((item) => (
            <MediaCard key={`${item.type}-${item.id}`} media={item} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

import { tmdbMovies, tmdbSeries, posterUrl } from "@/lib/tmdb/client";
import { anilistAnime } from "@/lib/anilist/client";
import { MediaCard } from "@/components/media/MediaCard";
import type { UnifiedMedia } from "@/types/media";

interface Props {
  searchParams: Promise<{ q?: string; type?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const { q = "", type = "all" } = await searchParams;

  if (!q.trim()) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground">
        <p className="text-4xl mb-4">🔍</p>
        <p>Busca películas, series o anime</p>
      </div>
    );
  }

  const results: UnifiedMedia[] = [];

  await Promise.all([
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

  const typeLabels = { all: "Todo", movie: "Películas", series: "Series", anime: "Anime" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          Resultados para <span style={{ color: "var(--gold)" }}>"{q}"</span>
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{results.length} resultados</span>
          <a
            href="/home"
            className="text-sm px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            ✕ Cancelar
          </a>
        </div>
      </div>

      {/* Filtro tipo */}
      <div className="flex gap-2">
        {(["all", "movie", "series", "anime"] as const).map((t) => (
          <a
            key={t}
            href={`/search?q=${encodeURIComponent(q)}&type=${t}`}
            className="px-3 py-1.5 rounded-full text-sm border transition-colors"
            style={type === t
              ? { backgroundColor: "var(--gold)", color: "#0A0A0A", borderColor: "var(--gold)" }
              : { borderColor: "var(--border)", color: "var(--muted-foreground)" }}
          >
            {typeLabels[t]}
          </a>
        ))}
      </div>

      {results.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center">No se encontraron resultados</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
          {results.map((item) => (
            <MediaCard key={`${item.type}-${item.id}`} media={item} />
          ))}
        </div>
      )}
    </div>
  );
}

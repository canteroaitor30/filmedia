import { tmdbSeries, posterUrl } from "@/lib/tmdb/client";
import { Carousel } from "@/components/media/Carousel";
import type { UnifiedMedia } from "@/types/media";

const SERIES_GENRES = [
  { id: 18, name: "Drama" },
  { id: 35, name: "Comedia" },
  { id: 80, name: "Crimen" },
  { id: 10765, name: "Ciencia ficción y fantasía" },
];

function toUnified(s: Awaited<ReturnType<typeof tmdbSeries.topRated>>["results"][0]): UnifiedMedia {
  return {
    id: s.id,
    type: "series",
    title: s.name,
    originalTitle: s.original_name,
    overview: s.overview,
    posterUrl: posterUrl(s.poster_path),
    backdropUrl: null,
    year: s.first_air_date ? new Date(s.first_air_date).getFullYear() : null,
    score: s.vote_average ? s.vote_average * 10 : null,
    genres: [],
  };
}

export default async function SeriesPage() {
  const [topRated, ...genreResults] = await Promise.all([
    tmdbSeries.topRated(),
    ...SERIES_GENRES.map((g) => tmdbSeries.byGenre(g.id)),
  ]);

  return (
    <div className="space-y-12">
      <div className="pb-2 border-b border-border/50">
        <h1 className="text-3xl font-bold tracking-tight">Series</h1>
      </div>
      <Carousel title="Mejor valoradas" items={topRated.results.slice(0, 20).map(toUnified)} />
      {SERIES_GENRES.map((genre, i) => (
        <Carousel
          key={genre.id}
          title={genre.name}
          items={(genreResults[i]?.results ?? []).slice(0, 20).map(toUnified)}
        />
      ))}
    </div>
  );
}

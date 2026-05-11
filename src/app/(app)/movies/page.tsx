import { tmdbMovies, posterUrl } from "@/lib/tmdb/client";
import { Carousel } from "@/components/media/Carousel";
import type { UnifiedMedia } from "@/types/media";

const MOVIE_GENRES = [
  { id: 28, name: "Acción" },
  { id: 35, name: "Comedia" },
  { id: 18, name: "Drama" },
  { id: 27, name: "Terror" },
  { id: 878, name: "Ciencia ficción" },
  { id: 53, name: "Thriller" },
  { id: 10749, name: "Romance" },
  { id: 16, name: "Animación" },
];

function toUnified(m: Awaited<ReturnType<typeof tmdbMovies.topRated>>["results"][0]): UnifiedMedia {
  return {
    id: m.id,
    type: "movie",
    title: m.title,
    originalTitle: m.original_title,
    overview: m.overview,
    posterUrl: posterUrl(m.poster_path),
    backdropUrl: null,
    year: m.release_date ? new Date(m.release_date).getFullYear() : null,
    score: m.vote_average ? m.vote_average * 10 : null,
    genres: [],
  };
}

export default async function MoviesPage() {
  const [topRated, ...genreResults] = await Promise.all([
    tmdbMovies.topRated(),
    ...MOVIE_GENRES.slice(0, 4).map((g) => tmdbMovies.byGenre(g.id)),
  ]);

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold">Películas</h1>
      <Carousel title="Mejor valoradas" items={topRated.results.slice(0, 20).map(toUnified)} />
      {MOVIE_GENRES.slice(0, 4).map((genre, i) => (
        <Carousel
          key={genre.id}
          title={genre.name}
          items={(genreResults[i]?.results ?? []).slice(0, 20).map(toUnified)}
        />
      ))}
    </div>
  );
}

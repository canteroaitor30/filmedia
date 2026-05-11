import { tmdbMovies, tmdbSeries, posterUrl } from "@/lib/tmdb/client";
import { anilistAnime } from "@/lib/anilist/client";
import { Carousel } from "@/components/media/Carousel";
import type { UnifiedMedia } from "@/types/media";

export default async function HomePage() {
  const [
    topMovies, topSeries, topAnime,
    actionMovies, dramaMovies,
    dramaSeries, comedySeries, actionAnime,
  ] = await Promise.all([
    tmdbMovies.topRated(),
    tmdbSeries.topRated(),
    anilistAnime.topRated(),
    tmdbMovies.byGenre(28),
    tmdbMovies.byGenre(18),
    tmdbSeries.byGenre(18),
    tmdbSeries.byGenre(35),
    anilistAnime.byGenre("Action"),
  ]);

  const toMovie = (m: typeof topMovies.results[0]): UnifiedMedia => ({
    id: m.id, type: "movie",
    title: m.title, originalTitle: m.original_title,
    overview: m.overview, posterUrl: posterUrl(m.poster_path),
    backdropUrl: null,
    year: m.release_date ? new Date(m.release_date).getFullYear() : null,
    score: m.vote_average ? m.vote_average * 10 : null, genres: [],
  });

  const toSeries = (s: typeof topSeries.results[0]): UnifiedMedia => ({
    id: s.id, type: "series",
    title: s.name, originalTitle: s.original_name,
    overview: s.overview, posterUrl: posterUrl(s.poster_path),
    backdropUrl: null,
    year: s.first_air_date ? new Date(s.first_air_date).getFullYear() : null,
    score: s.vote_average ? s.vote_average * 10 : null, genres: [],
  });

  const toAnime = (a: typeof topAnime.media[0]): UnifiedMedia => ({
    id: a.id, type: "anime",
    title: a.title.english ?? a.title.romaji, originalTitle: a.title.native,
    overview: a.description, posterUrl: a.coverImage.large,
    backdropUrl: a.bannerImage, year: a.startDate.year,
    score: a.averageScore, genres: a.genres,
  });

  return (
    <div className="space-y-10">
      <Carousel title="Películas mejor valoradas" items={topMovies.results.slice(0, 20).map(toMovie)} />
      <Carousel title="Series mejor valoradas" items={topSeries.results.slice(0, 20).map(toSeries)} />
      <Carousel title="Anime mejor valorado" items={topAnime.media.map(toAnime)} />
      <Carousel title="Acción" items={actionMovies.results.slice(0, 20).map(toMovie)} />
      <Carousel title="Drama" items={dramaMovies.results.slice(0, 20).map(toMovie)} />
      <Carousel title="Series de drama" items={dramaSeries.results.slice(0, 20).map(toSeries)} />
      <Carousel title="Comedias" items={comedySeries.results.slice(0, 20).map(toSeries)} />
      <Carousel title="Anime de acción" items={actionAnime.media.map(toAnime)} />
    </div>
  );
}

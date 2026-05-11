import { createClient } from "@/lib/supabase/server";
import { tmdbMovies, tmdbSeries, posterUrl } from "@/lib/tmdb/client";
import { anilistAnime } from "@/lib/anilist/client";
import { Carousel } from "@/components/media/Carousel";
import type { UnifiedMedia } from "@/types/media";

function toMovie(m: { id: number; title: string; original_title: string; overview: string; poster_path: string | null; backdrop_path?: string | null; release_date: string; vote_average: number; vote_count: number }): UnifiedMedia {
  return {
    id: m.id, type: "movie",
    title: m.title, originalTitle: m.original_title,
    overview: m.overview, posterUrl: posterUrl(m.poster_path),
    backdropUrl: null,
    year: m.release_date ? new Date(m.release_date).getFullYear() : null,
    score: m.vote_average ? m.vote_average * 10 : null, genres: [],
  };
}

function toSeries(s: { id: number; name: string; original_name: string; overview: string; poster_path: string | null; backdrop_path?: string | null; first_air_date: string; vote_average: number; vote_count: number }): UnifiedMedia {
  return {
    id: s.id, type: "series",
    title: s.name, originalTitle: s.original_name,
    overview: s.overview, posterUrl: posterUrl(s.poster_path),
    backdropUrl: null,
    year: s.first_air_date ? new Date(s.first_air_date).getFullYear() : null,
    score: s.vote_average ? s.vote_average * 10 : null, genres: [],
  };
}

function toAnime(a: { id: number; title: { english: string | null; romaji: string; native: string }; description: string | null; coverImage: { large: string }; bannerImage: string | null; startDate: { year: number | null }; averageScore: number | null; genres: string[] }): UnifiedMedia {
  return {
    id: a.id, type: "anime",
    title: a.title.english ?? a.title.romaji, originalTitle: a.title.native,
    overview: a.description, posterUrl: a.coverImage.large,
    backdropUrl: a.bannerImage, year: a.startDate.year,
    score: a.averageScore, genres: a.genres,
  };
}

export default async function HomePage() {
  const supabase = await createClient();

  const [
    { data: { user } },
    topMovies, topSeries, topAnime,
    actionMovies, dramaMovies,
    dramaSeries, comedySeries, actionAnime,
  ] = await Promise.all([
    supabase.auth.getUser(),
    tmdbMovies.topRated(),
    tmdbSeries.topRated(),
    anilistAnime.topRated(),
    tmdbMovies.byGenre(28),
    tmdbMovies.byGenre(18),
    tmdbSeries.byGenre(18),
    tmdbSeries.byGenre(35),
    anilistAnime.byGenre("Action"),
  ]);

  // Carruseles personalizados
  let recMovies: UnifiedMedia[] = [];
  let recSeries: UnifiedMedia[] = [];
  let friendsWatching: UnifiedMedia[] = [];
  let recMovieTitle = "";
  let recSeriesTitle = "";

  if (user) {
    const [topRatedRes, followsRes] = await Promise.all([
      supabase.from("user_media")
        .select("media_type, external_id, rating")
        .eq("user_id", user.id)
        .eq("status", "watched")
        .gte("rating", 4)
        .order("rating", { ascending: false })
        .limit(10),
      supabase.from("follows")
        .select("following_id")
        .eq("follower_id", user.id),
    ]);

    const topRated = (topRatedRes.data ?? []) as { media_type: string; external_id: number; rating: number }[];
    const followingIds = (followsRes.data ?? []).map((f: { following_id: string }) => f.following_id);

    const topMovie = topRated.find((i) => i.media_type === "movie");
    const topSerie = topRated.find((i) => i.media_type === "series");

    const [movieRecsRes, seriesRecsRes, friendsRes] = await Promise.all([
      topMovie ? tmdbMovies.recommendations(topMovie.external_id).catch(() => null) : Promise.resolve(null),
      topSerie ? tmdbSeries.recommendations(topSerie.external_id).catch(() => null) : Promise.resolve(null),
      followingIds.length
        ? supabase.from("user_media")
            .select("media_type, external_id")
            .in("user_id", followingIds)
            .eq("status", "watched")
            .order("updated_at", { ascending: false })
            .limit(30)
        : Promise.resolve({ data: [] }),
    ]);

    if (movieRecsRes?.results?.length && topMovie) {
      const detail = await tmdbMovies.detail(topMovie.external_id).catch(() => null);
      recMovieTitle = detail?.title ?? "";
      recMovies = movieRecsRes.results.slice(0, 20).map(toMovie);
    }

    if (seriesRecsRes?.results?.length && topSerie) {
      const detail = await tmdbSeries.detail(topSerie.external_id).catch(() => null);
      recSeriesTitle = detail?.name ?? "";
      recSeries = seriesRecsRes.results.slice(0, 20).map(toSeries);
    }

    const friendItems = (friendsRes.data ?? []) as { media_type: string; external_id: number }[];
    const seen = new Set<string>();
    const uniqueFriendItems = friendItems.filter((item) => {
      const key = `${item.media_type}-${item.external_id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 15);

    if (uniqueFriendItems.length) {
      const enriched = await Promise.all(
        uniqueFriendItems.map(async (item) => {
          try {
            if (item.media_type === "movie") return toMovie(await tmdbMovies.detail(item.external_id));
            if (item.media_type === "series") return toSeries(await tmdbSeries.detail(item.external_id));
            return toAnime(await anilistAnime.detail(item.external_id));
          } catch { return null; }
        })
      );
      friendsWatching = enriched.filter(Boolean) as UnifiedMedia[];
    }
  }

  return (
    <div className="space-y-10">
      {friendsWatching.length > 0 && (
        <Carousel title="Tus amigos están viendo" items={friendsWatching} />
      )}
      {recMovies.length > 0 && (
        <Carousel title={recMovieTitle ? `Porque te gustó ${recMovieTitle}` : "Recomendado para ti"} items={recMovies} />
      )}
      {recSeries.length > 0 && (
        <Carousel title={recSeriesTitle ? `Porque te gustó ${recSeriesTitle}` : "Series recomendadas"} items={recSeries} />
      )}
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

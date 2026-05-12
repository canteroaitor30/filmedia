import { createClient } from "@/lib/supabase/server";
import { tmdbMovies, tmdbSeries, posterUrl } from "@/lib/tmdb/client";
import { Carousel } from "@/components/media/Carousel";
import type { UnifiedMedia } from "@/types/media";

function toMovie(m: { id: number; title: string; original_title: string; overview: string; poster_path: string | null; release_date: string; vote_average: number; vote_count: number }): UnifiedMedia {
  return {
    id: m.id, type: "movie",
    title: m.title, originalTitle: m.original_title,
    overview: m.overview, posterUrl: posterUrl(m.poster_path),
    backdropUrl: null,
    year: m.release_date ? new Date(m.release_date).getFullYear() : null,
    score: m.vote_average ? m.vote_average * 10 : null, genres: [],
  };
}

function toSeries(s: { id: number; name: string; original_name: string; overview: string; poster_path: string | null; first_air_date: string; vote_average: number; vote_count: number }): UnifiedMedia {
  return {
    id: s.id, type: "series",
    title: s.name, originalTitle: s.original_name,
    overview: s.overview, posterUrl: posterUrl(s.poster_path),
    backdropUrl: null,
    year: s.first_air_date ? new Date(s.first_air_date).getFullYear() : null,
    score: s.vote_average ? s.vote_average * 10 : null, genres: [],
  };
}

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: topRatedRes } = await supabase
    .from("user_media")
    .select("media_type, external_id, rating")
    .eq("user_id", user.id)
    .eq("status", "watched")
    .gte("rating", 3)
    .order("rating", { ascending: false })
    .limit(20);

  const topRated = (topRatedRes ?? []) as { media_type: string; external_id: number; rating: number }[];
  const topUserMovies = topRated.filter((i) => i.media_type === "movie").slice(0, 3);
  const topUserSeries = topRated.filter((i) => i.media_type === "series").slice(0, 3);

  const [movieRecResults, seriesRecResults] = await Promise.all([
    Promise.all(
      topUserMovies.map(async (item) => {
        const [recs, detail] = await Promise.all([
          tmdbMovies.recommendations(item.external_id).catch(() => null),
          tmdbMovies.detail(item.external_id).catch(() => null),
        ]);
        if (!recs?.results?.length || !detail) return null;
        return { title: detail.title, items: recs.results.slice(0, 20).map(toMovie) };
      })
    ),
    Promise.all(
      topUserSeries.map(async (item) => {
        const [recs, detail] = await Promise.all([
          tmdbSeries.recommendations(item.external_id).catch(() => null),
          tmdbSeries.detail(item.external_id).catch(() => null),
        ]);
        if (!recs?.results?.length || !detail) return null;
        return { title: detail.name, items: recs.results.slice(0, 20).map(toSeries) };
      })
    ),
  ]);

  const personalRecs: { title: string; items: UnifiedMedia[] }[] = [];
  const movieRecs = movieRecResults.filter(Boolean) as { title: string; items: UnifiedMedia[] }[];
  const seriesRecs = seriesRecResults.filter(Boolean) as { title: string; items: UnifiedMedia[] }[];
  const maxRecs = Math.max(movieRecs.length, seriesRecs.length);
  for (let i = 0; i < maxRecs && personalRecs.length < 4; i++) {
    if (movieRecs[i]) personalRecs.push(movieRecs[i]);
    if (seriesRecs[i] && personalRecs.length < 4) personalRecs.push(seriesRecs[i]);
  }

  if (!personalRecs.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-3">
        <p className="text-lg font-medium">Aún no hay recomendaciones</p>
        <p className="text-sm text-muted-foreground max-w-xs">
          Puntúa películas y series que hayas visto para que podamos sugerirte contenido similar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {personalRecs.map((rec) => (
        <Carousel key={rec.title} title={`Porque te gustó ${rec.title}`} items={rec.items} />
      ))}
    </div>
  );
}

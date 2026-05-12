import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { tmdbMovies, tmdbSeries, posterUrl } from "@/lib/tmdb/client";
import { anilistAnime } from "@/lib/anilist/client";
import { OnboardingFlow, type OnboardingItem } from "@/components/onboarding/OnboardingFlow";

const MOVIE_IDS = [278, 157336, 680, 98]; // Cadena perpetua, Interstellar, Pulp Fiction, Gladiator
const SERIES_IDS = [1399, 2288, 1396, 1100]; // GoT, Prison Break, Breaking Bad, HIMYM
const ANIME_IDS = [16498, 813, 120120, 105310]; // AoT, DBZ, Tokyo Revengers, Fire Force

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, onboarding_completed")
    .eq("id", user.id)
    .single();

  if (profile?.onboarding_completed) redirect("/home");

  const [movies, series, animes] = await Promise.all([
    Promise.all(MOVIE_IDS.map((id) => tmdbMovies.detail(id).catch(() => null))),
    Promise.all(SERIES_IDS.map((id) => tmdbSeries.detail(id).catch(() => null))),
    Promise.all(ANIME_IDS.map((id) => anilistAnime.detail(id).catch(() => null))),
  ]);

  const movieItems: OnboardingItem[] = movies.flatMap((m) => m ? [{
    mediaType: "movie" as const,
    externalId: m.id,
    title: m.title,
    poster: posterUrl(m.poster_path, "w185"),
    year: m.release_date ? new Date(m.release_date).getFullYear() : null,
  }] : []);

  const seriesItems: OnboardingItem[] = series.flatMap((s) => s ? [{
    mediaType: "series" as const,
    externalId: s.id,
    title: s.name,
    poster: posterUrl(s.poster_path, "w185"),
    year: s.first_air_date ? new Date(s.first_air_date).getFullYear() : null,
  }] : []);

  const animeItems: OnboardingItem[] = animes.flatMap((a) => a ? [{
    mediaType: "anime" as const,
    externalId: a.id,
    title: a.title.english ?? a.title.romaji,
    poster: a.coverImage.large,
    year: a.startDate?.year ?? null,
  }] : []);

  // Intercalar: 1 película, 1 serie, 1 anime
  const items: OnboardingItem[] = [];
  const max = Math.max(movieItems.length, seriesItems.length, animeItems.length);
  for (let i = 0; i < max; i++) {
    if (movieItems[i]) items.push(movieItems[i]);
    if (seriesItems[i]) items.push(seriesItems[i]);
    if (animeItems[i]) items.push(animeItems[i]);
  }

  return <OnboardingFlow username={profile?.username ?? ""} items={items} />;
}

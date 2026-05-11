import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { tmdbMovies, tmdbSeries, posterUrl } from "@/lib/tmdb/client";
import { anilistAnime } from "@/lib/anilist/client";
import { OnboardingFlow, type OnboardingItem } from "@/components/onboarding/OnboardingFlow";

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

  const [moviesPage, seriesPage, animePage] = await Promise.all([
    tmdbMovies.topRated(1).catch(() => ({ results: [] })),
    tmdbSeries.topRated(1).catch(() => ({ results: [] })),
    anilistAnime.topRated(1).catch(() => ({ media: [] })),
  ]);

  const movieItems: OnboardingItem[] = moviesPage.results.slice(0, 6).map((m) => ({
    mediaType: "movie",
    externalId: m.id,
    title: m.title,
    poster: posterUrl(m.poster_path, "w185"),
    year: m.release_date ? new Date(m.release_date).getFullYear() : null,
  }));

  const seriesItems: OnboardingItem[] = seriesPage.results.slice(0, 6).map((s) => ({
    mediaType: "series",
    externalId: s.id,
    title: s.name,
    poster: posterUrl(s.poster_path, "w185"),
    year: s.first_air_date ? new Date(s.first_air_date).getFullYear() : null,
  }));

  const animeItems: OnboardingItem[] = (animePage.media ?? []).slice(0, 6).map((a) => ({
    mediaType: "anime",
    externalId: a.id,
    title: a.title.english ?? a.title.romaji,
    poster: a.coverImage.large,
    year: a.startDate?.year ?? null,
  }));

  // Interleave: 2 movies, 2 series, 2 anime, repeat
  const items: OnboardingItem[] = [];
  for (let i = 0; i < 6; i += 2) {
    items.push(...movieItems.slice(i, i + 2), ...seriesItems.slice(i, i + 2), ...animeItems.slice(i, i + 2));
  }

  return <OnboardingFlow username={profile?.username ?? ""} items={items} />;
}

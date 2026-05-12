"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { tmdbMovies, tmdbSeries } from "@/lib/tmdb/client";
import { anilistAnime } from "@/lib/anilist/client";
import type { MediaType, MediaStatus, Platform } from "@/types/database";

export async function saveWatchEntry(params: {
  mediaType: MediaType;
  externalId: number;
  status: MediaStatus;
  rating: number | null;
  platform: Platform | null;
  title: string;
  entryId?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const payload = {
    user_id: user.id,
    media_type: params.mediaType,
    external_id: params.externalId,
    status: params.status,
    rating: params.status === "watched" ? params.rating : null,
    platform: params.status === "watched" ? params.platform : null,
    watched_at: params.status === "watched" ? new Date().toISOString() : null,
  };

  let newId = params.entryId;
  if (params.entryId) {
    await supabase.from("user_media").update(payload).eq("id", params.entryId);
  } else {
    const { data } = await supabase.from("user_media").insert(payload).select("id").single();
    newId = data?.id;
  }

  populateCache(params.mediaType, params.externalId, params.title).catch(() => {});

  return { id: newId };
}

export async function deleteWatchEntry(entryId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("user_media").delete().eq("id", entryId);
  if (error) throw new Error(error.message);
}

export async function saveOnboardingRatings(
  profileData: { displayName: string; bio: string; avatarUrl: string; privacyProfile?: string; privacyWatchlist?: string },
  ratings: { mediaType: MediaType; externalId: number; title: string; rating: number }[]
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase.from("profiles").update({
    display_name: profileData.displayName || null,
    bio: profileData.bio || null,
    avatar_url: profileData.avatarUrl || null,
    privacy_profile: (profileData.privacyProfile ?? "public") as "public" | "followers" | "private",
    privacy_watchlist: (profileData.privacyWatchlist ?? "public") as "public" | "followers" | "private",
    onboarding_completed: true,
  }).eq("id", user.id);

  if (ratings.length) {
    await supabase.from("user_media").upsert(
      ratings.map((r) => ({
        user_id: user.id,
        media_type: r.mediaType,
        external_id: r.externalId,
        status: "watched" as MediaStatus,
        rating: r.rating,
        watched_at: new Date().toISOString(),
      })),
      { onConflict: "user_id,media_type,external_id", ignoreDuplicates: true }
    );
    ratings.forEach((r) => populateCache(r.mediaType, r.externalId, r.title).catch(() => {}));
  }

  revalidatePath("/home");
  revalidatePath("/onboarding");
}

async function populateCache(mediaType: MediaType, externalId: number, title: string) {
  const admin = createAdminClient();
  let genres: string[] = [];
  let runtimeMinutes: number | null = null;
  let year: number | null = null;

  if (mediaType === "movie") {
    const m = await tmdbMovies.detail(externalId);
    genres = m.genres?.map((g) => g.name) ?? [];
    runtimeMinutes = m.runtime ?? null;
    year = m.release_date ? new Date(m.release_date).getFullYear() : null;
  } else if (mediaType === "series") {
    const s = await tmdbSeries.detail(externalId);
    genres = s.genres?.map((g) => g.name) ?? [];
    year = s.first_air_date ? new Date(s.first_air_date).getFullYear() : null;
  } else {
    const a = await anilistAnime.detail(externalId);
    genres = a.genres ?? [];
    runtimeMinutes = a.episodes && a.duration ? a.episodes * a.duration : null;
    year = a.startDate?.year ?? null;
  }

  await admin.from("media_cache").upsert(
    { media_type: mediaType, external_id: externalId, title, genres, runtime_minutes: runtimeMinutes, year, cached_at: new Date().toISOString() },
    { onConflict: "media_type,external_id" }
  );
}

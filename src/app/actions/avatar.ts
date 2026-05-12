"use server";

import { tmdbMovies, tmdbSeries } from "@/lib/tmdb/client";
import { createAdminClient } from "@/lib/supabase/admin";

export interface PersonEntry {
  id: number;
  name: string;
  role: "Actor" | "Directora" | "Director";
  profile_path: string;
}

const AVATAR_PROMPT =
  "Cinematic stylized avatar portrait. Inspired by {NAME}. Digital art, dramatic film lighting, artistic illustration, moody atmosphere, square format.";

export async function getPersonsFromRated(
  rated: Array<{ id: number; mediaType: "movie" | "series" }>
): Promise<PersonEntry[]> {
  const movieIds = rated.filter((r) => r.mediaType === "movie").map((r) => r.id);
  const seriesIds = rated.filter((r) => r.mediaType === "series").map((r) => r.id);

  const [movieCredits, seriesCredits] = await Promise.all([
    Promise.all(movieIds.map((id) => tmdbMovies.credits(id).catch(() => ({ cast: [], crew: [] })))),
    Promise.all(seriesIds.map((id) => tmdbSeries.credits(id).catch(() => ({ cast: [], crew: [] })))),
  ]);

  const seen = new Set<number>();
  const persons: PersonEntry[] = [];

  for (const credits of movieCredits) {
    for (const person of credits.cast.slice(0, 10)) {
      if (!seen.has(person.id) && person.profile_path) {
        seen.add(person.id);
        persons.push({ id: person.id, name: person.name, role: "Actor", profile_path: person.profile_path });
      }
    }
    for (const person of credits.crew.filter((c) => c.job === "Director")) {
      if (!seen.has(person.id) && person.profile_path) {
        seen.add(person.id);
        persons.push({ id: person.id, name: person.name, role: "Director", profile_path: person.profile_path });
      }
    }
  }

  for (const credits of seriesCredits) {
    for (const person of credits.cast.slice(0, 10)) {
      if (!seen.has(person.id) && person.profile_path) {
        seen.add(person.id);
        persons.push({ id: person.id, name: person.name, role: "Actor", profile_path: person.profile_path });
      }
    }
    for (const person of credits.crew.filter((c) => c.jobs.some((j) => j.job === "Creator" || j.job === "Director"))) {
      if (!seen.has(person.id) && person.profile_path) {
        seen.add(person.id);
        persons.push({ id: person.id, name: person.name, role: "Director", profile_path: person.profile_path });
      }
    }
  }

  return persons.slice(0, 20);
}

export async function generateAvatar(personName: string): Promise<string> {
  const prompt = encodeURIComponent(AVATAR_PROMPT.replace("{NAME}", personName));
  const url = `https://image.pollinations.ai/prompt/${prompt}?width=512&height=512&nologo=true&seed=${Date.now()}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Pollinations error ${res.status}`);

  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const admin = createAdminClient();
  const fileName = `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;

  const { error } = await admin.storage
    .from("avatars")
    .upload(fileName, buffer, { contentType: "image/jpeg" });

  if (error) throw new Error(error.message);

  const { data: { publicUrl } } = admin.storage.from("avatars").getPublicUrl(fileName);
  return publicUrl;
}

import { tmdbMovies, tmdbSeries, tmdbPerson, posterUrl } from "@/lib/tmdb/client";
import { NextResponse } from "next/server";

export type QuickResult = {
  id: number;
  type: "movie" | "series" | "person";
  title: string;
  subtitle: string;
  posterUrl: string | null;
  href: string;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ content: [], persons: [] });

  const [movies, series, persons] = await Promise.all([
    tmdbMovies.search(q).catch(() => ({ results: [] as any[] })),
    tmdbSeries.search(q).catch(() => ({ results: [] as any[] })),
    tmdbPerson.search(q).catch(() => ({ results: [] as any[] })),
  ]);

  const content: (QuickResult & { popularity: number })[] = [
    ...movies.results.slice(0, 10).map((m: any) => ({
      id: m.id, type: "movie" as const,
      title: m.title,
      subtitle: m.release_date ? String(new Date(m.release_date).getFullYear()) : "",
      posterUrl: posterUrl(m.poster_path, "w185"),
      href: `/movies/${m.id}`,
      popularity: m.vote_count ?? 0,
    })),
    ...series.results.slice(0, 10).map((s: any) => ({
      id: s.id, type: "series" as const,
      title: s.name,
      subtitle: s.first_air_date ? String(new Date(s.first_air_date).getFullYear()) : "",
      posterUrl: posterUrl(s.poster_path, "w185"),
      href: `/series/${s.id}`,
      popularity: s.vote_count ?? 0,
    })),
  ];

  content.sort((a, b) => b.popularity - a.popularity);

  const personResults: QuickResult[] = persons.results.slice(0, 4).map((p: any) => ({
    id: p.id, type: "person" as const,
    title: p.name,
    subtitle: p.known_for_department === "Acting" ? "Actor/Actriz"
      : p.known_for_department === "Directing" ? "Dirección"
      : p.known_for_department === "Writing" ? "Guión"
      : (p.known_for_department ?? ""),
    posterUrl: p.profile_path ? `https://image.tmdb.org/t/p/w185${p.profile_path}` : null,
    href: `/person/${p.id}`,
  }));

  return NextResponse.json({
    content: content.slice(0, 5).map(({ popularity: _, ...r }) => r),
    persons: personResults,
  });
}

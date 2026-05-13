const BASE_URL = "https://api.themoviedb.org/3";
export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

async function tmdb<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set("language", "es-ES");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}` },
    next: { revalidate: 3600 },
  });

  if (!res.ok) throw new Error(`TMDB error ${res.status}: ${path}`);
  return res.json();
}

export interface TmdbMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  genres?: { id: number; name: string }[];
  runtime?: number;
  original_language: string;
}

export interface TmdbSeries {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  genres?: { id: number; name: string }[];
  number_of_seasons?: number;
  original_language: string;
}

export interface TmdbPage<T> {
  results: T[];
  total_pages: number;
  total_results: number;
  page: number;
}

// Movies
export const tmdbMovies = {
  topRated: (page = 1) =>
    tmdb<TmdbPage<TmdbMovie>>("/movie/top_rated", { page: String(page) }),
  byGenre: (genreId: number, page = 1) =>
    tmdb<TmdbPage<TmdbMovie>>("/discover/movie", {
      with_genres: String(genreId),
      sort_by: "vote_average.desc",
      "vote_count.gte": "200",
      page: String(page),
    }),
  detail: (id: number) =>
    tmdb<TmdbMovie>(`/movie/${id}`),
  search: (query: string, page = 1) =>
    tmdb<TmdbPage<TmdbMovie>>("/search/movie", { query, page: String(page) }),
  genres: () =>
    tmdb<{ genres: { id: number; name: string }[] }>("/genre/movie/list"),
  similar: (id: number) =>
    tmdb<TmdbPage<TmdbMovie>>(`/movie/${id}/similar`),
  recommendations: (id: number) =>
    tmdb<TmdbPage<TmdbMovie>>(`/movie/${id}/recommendations`),
  credits: (id: number) =>
    tmdb<{
      cast: { id: number; name: string; character: string; profile_path: string | null }[];
      crew: { id: number; name: string; job: string; profile_path: string | null }[];
    }>(`/movie/${id}/credits`),
};

// Series
export const tmdbSeries = {
  topRated: (page = 1) =>
    tmdb<TmdbPage<TmdbSeries>>("/tv/top_rated", { page: String(page) }),
  byGenre: (genreId: number, page = 1) =>
    tmdb<TmdbPage<TmdbSeries>>("/discover/tv", {
      with_genres: String(genreId),
      sort_by: "vote_average.desc",
      "vote_count.gte": "100",
      page: String(page),
    }),
  detail: (id: number) =>
    tmdb<TmdbSeries>(`/tv/${id}`),
  search: (query: string, page = 1) =>
    tmdb<TmdbPage<TmdbSeries>>("/search/tv", { query, page: String(page) }),
  genres: () =>
    tmdb<{ genres: { id: number; name: string }[] }>("/genre/tv/list"),
  similar: (id: number) =>
    tmdb<TmdbPage<TmdbSeries>>(`/tv/${id}/similar`),
  recommendations: (id: number) =>
    tmdb<TmdbPage<TmdbSeries>>(`/tv/${id}/recommendations`),
  credits: (id: number) =>
    tmdb<{
      cast: { id: number; name: string; profile_path: string | null; total_episode_count: number; roles?: { character: string }[] }[];
      crew: { id: number; name: string; profile_path: string | null; jobs: { job: string }[] }[];
    }>(`/tv/${id}/aggregate_credits`),
};

export interface TmdbPerson {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  known_for_department: string;
}

export interface TmdbPersonCredit {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  character?: string;
  job?: string;
  media_type: "movie" | "tv";
}

export const tmdbPerson = {
  detail: (id: number) =>
    tmdb<TmdbPerson>(`/person/${id}`),
  combinedCredits: (id: number) =>
    tmdb<{ cast: TmdbPersonCredit[]; crew: TmdbPersonCredit[] }>(`/person/${id}/combined_credits`),
  search: (query: string, page = 1) =>
    tmdb<TmdbPage<TmdbPerson>>("/search/person", { query, page: String(page) }),
};

export function posterUrl(path: string | null, size: "w185" | "w342" | "w500" | "original" = "w342") {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function backdropUrl(path: string | null, size: "w780" | "w1280" | "original" = "w1280") {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

const ANILIST_URL = "https://graphql.anilist.co";

async function anilist<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(ANILIST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 3600 },
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data;
}

export interface AnilistMedia {
  id: number;
  title: { romaji: string; english: string | null; native: string };
  description: string | null;
  coverImage: { large: string; extraLarge: string };
  bannerImage: string | null;
  averageScore: number | null;
  popularity: number;
  genres: string[];
  episodes: number | null;
  duration: number | null;
  status: string;
  startDate: { year: number | null };
  format: string;
}

interface PageInfo { total: number; currentPage: number; hasNextPage: boolean; }

const MEDIA_FIELDS = `
  id
  title { romaji english native }
  description(asHtml: false)
  coverImage { large extraLarge }
  bannerImage
  averageScore
  popularity
  genres
  episodes
  duration
  status
  startDate { year }
  format
`;

export const anilistAnime = {
  topRated: async (page = 1) => {
    const data = await anilist<{ Page: { pageInfo: PageInfo; media: AnilistMedia[] } }>(
      `query($page: Int) {
        Page(page: $page, perPage: 20) {
          pageInfo { total currentPage hasNextPage }
          media(type: ANIME, sort: SCORE_DESC, isAdult: false) { ${MEDIA_FIELDS} }
        }
      }`,
      { page }
    );
    return data.Page;
  },

  byGenre: async (genre: string, page = 1) => {
    const data = await anilist<{ Page: { pageInfo: PageInfo; media: AnilistMedia[] } }>(
      `query($genre: String, $page: Int) {
        Page(page: $page, perPage: 20) {
          pageInfo { total currentPage hasNextPage }
          media(type: ANIME, genre: $genre, sort: SCORE_DESC, isAdult: false) { ${MEDIA_FIELDS} }
        }
      }`,
      { genre, page }
    );
    return data.Page;
  },

  detail: async (id: number) => {
    const data = await anilist<{ Media: AnilistMedia }>(
      `query($id: Int) {
        Media(id: $id, type: ANIME) { ${MEDIA_FIELDS} }
      }`,
      { id }
    );
    return data.Media;
  },

  search: async (query: string, page = 1) => {
    const data = await anilist<{ Page: { pageInfo: PageInfo; media: AnilistMedia[] } }>(
      `query($search: String, $page: Int) {
        Page(page: $page, perPage: 20) {
          pageInfo { total currentPage hasNextPage }
          media(type: ANIME, search: $search, isAdult: false) { ${MEDIA_FIELDS} }
        }
      }`,
      { search: query, page }
    );
    return data.Page;
  },
};

export const ANIME_GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy",
  "Horror", "Mystery", "Romance", "Sci-Fi", "Slice of Life",
  "Sports", "Supernatural", "Thriller",
];

export const GENRE_ES: Record<string, string> = {
  Action: "Acción",
  Adventure: "Aventura",
  Comedy: "Comedia",
  Drama: "Drama",
  Fantasy: "Fantasía",
  Horror: "Terror",
  Mystery: "Misterio",
  Romance: "Romance",
  "Sci-Fi": "Ciencia ficción",
  "Slice of Life": "Slice of life",
  Sports: "Deportes",
  Supernatural: "Sobrenatural",
  Thriller: "Thriller",
  "Martial Arts": "Artes marciales",
  Music: "Música",
  Psychological: "Psicológico",
  Ecchi: "Ecchi",
  Mecha: "Mecha",
  Magic: "Magia",
  "School": "Escolar",
  "Action & Adventure": "Acción y aventura",
  "Science Fiction": "Ciencia ficción",
  "Science Fiction & Fantasy": "Ciencia ficción",
  "War & Politics": "Guerra y política",
  "Kids": "Infantil",
  "Reality": "Telerrealidad",
  "Talk": "Tertulias",
  "News": "Noticias",
  "Soap": "Telenovela",
  "Family": "Familia",
  "Western": "Western",
  "Crime": "Crimen",
  "Documentary": "Documental",
  "History": "Historia",
  "Animation": "Animación",
  "War": "Guerra",
};

export function translateGenre(genre: string): string {
  return GENRE_ES[genre] ?? genre;
}

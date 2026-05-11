import type { MediaType } from "./database";

export interface UnifiedMedia {
  id: number;
  type: MediaType;
  title: string;
  originalTitle: string;
  overview: string | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  year: number | null;
  score: number | null;
  genres: string[];
}

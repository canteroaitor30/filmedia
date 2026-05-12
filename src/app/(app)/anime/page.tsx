import { anilistAnime, ANIME_GENRES, translateGenre } from "@/lib/anilist/client";
import { Carousel } from "@/components/media/Carousel";
import type { UnifiedMedia } from "@/types/media";
import type { AnilistMedia } from "@/lib/anilist/client";

function toUnified(a: AnilistMedia): UnifiedMedia {
  return {
    id: a.id,
    type: "anime",
    title: a.title.english ?? a.title.romaji,
    originalTitle: a.title.native,
    overview: a.description,
    posterUrl: a.coverImage.large,
    backdropUrl: a.bannerImage,
    year: a.startDate.year,
    score: a.averageScore,
    genres: a.genres,
  };
}

export default async function AnimePage() {
  const [topRated, ...genreResults] = await Promise.all([
    anilistAnime.topRated(),
    ...ANIME_GENRES.slice(0, 4).map((g) => anilistAnime.byGenre(g)),
  ]);

  return (
    <div className="space-y-12">
      <div className="pb-2 border-b border-border/50">
        <h1 className="text-3xl font-bold tracking-tight">Anime</h1>
        <p className="text-sm text-muted-foreground mt-1">Los mejores animes de todos los tiempos</p>
      </div>
      <Carousel title="Mejor valorados" items={topRated.media.map(toUnified)} />
      {ANIME_GENRES.slice(0, 4).map((genre, i) => (
        <Carousel
          key={genre}
          title={translateGenre(genre)}
          items={(genreResults[i]?.media ?? []).map(toUnified)}
        />
      ))}
    </div>
  );
}

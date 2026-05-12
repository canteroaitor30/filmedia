import { anilistAnime, translateGenre } from "@/lib/anilist/client";
import { notFound } from "next/navigation";
import Image from "next/image";
import { WatchButton } from "@/components/media/WatchButton";
import { WatchlistButton } from "@/components/media/WatchlistButton";
import { ReviewSection } from "@/components/media/ReviewSection";
import { AddToListButton } from "@/components/lists/AddToListButton";

export default async function AnimeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const animeId = Number(id);
  if (isNaN(animeId)) notFound();

  const anime = await anilistAnime.detail(animeId).catch(() => null);
  if (!anime) notFound();

  const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : null;
  const overview = anime.description?.replace(/<[^>]*>/g, "") ?? null;

  return (
    <div className="-mx-6 -mt-8">
      <div className="relative h-72 md:h-96 w-full overflow-hidden">
        {anime.bannerImage ? (
          <Image src={anime.bannerImage} alt={anime.title.romaji} fill className="object-cover" priority />
        ) : (
          <div className="h-full bg-secondary" />
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 30%, #0A0A0A 100%)" }} />
      </div>

      <div className="px-6 -mt-24 relative z-10 flex gap-6">
        <div className="hidden md:block flex-shrink-0 w-40 rounded-lg overflow-hidden shadow-2xl">
          <Image src={anime.coverImage.extraLarge} alt={anime.title.romaji} width={160} height={240} className="object-cover w-full" />
        </div>

        <div className="flex-1 pt-20 md:pt-4">
          <h1 className="text-2xl md:text-3xl font-bold">{anime.title.english ?? anime.title.romaji}</h1>
          {anime.title.english && (
            <p className="text-sm text-muted-foreground mt-0.5">{anime.title.romaji}</p>
          )}
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
            {anime.startDate.year && <span>{anime.startDate.year}</span>}
            {anime.episodes && <span>{anime.episodes} episodios</span>}
            {score && (
              <span className="font-semibold px-2 py-0.5 rounded text-xs" style={{ backgroundColor: "var(--gold)", color: "#0A0A0A" }}>
                {score}
              </span>
            )}
            {anime.genres.slice(0, 4).map((g) => (
              <span key={g} className="border border-border rounded px-2 py-0.5 text-xs">{translateGenre(g)}</span>
            ))}
          </div>

          {overview && (
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-2xl">{overview}</p>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            <WatchButton mediaType="anime" externalId={animeId} title={anime.title.english ?? anime.title.romaji} />
            <WatchlistButton mediaType="anime" externalId={animeId} title={anime.title.english ?? anime.title.romaji} />
            <AddToListButton mediaType="anime" externalId={animeId} />
          </div>
        </div>
      </div>
      <div className="px-6 mt-2">
        <ReviewSection mediaType="anime" externalId={animeId} />
      </div>
    </div>
  );
}

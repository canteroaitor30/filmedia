import { anilistAnime, translateGenre } from "@/lib/anilist/client";
import { notFound } from "next/navigation";
import Image from "next/image";
import { WatchButton } from "@/components/media/WatchButton";
import { WatchlistButton } from "@/components/media/WatchlistButton";
import { ReviewSection } from "@/components/media/ReviewSection";
import { AddToListButton } from "@/components/lists/AddToListButton";
import { Star, Calendar, PlayCircle } from "lucide-react";

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
      <div className="relative h-72 md:h-[420px] w-full overflow-hidden">
        {anime.bannerImage ? (
          <Image src={anime.bannerImage} alt={anime.title.romaji} fill className="object-cover" priority />
        ) : (
          <div className="h-full bg-secondary" />
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(10,10,10,0.1) 0%, rgba(10,10,10,0.5) 50%, #0A0A0A 100%)" }} />
      </div>

      <div className="px-6 -mt-32 relative z-10 flex gap-6">
        <div className="hidden md:block flex-shrink-0 w-44 rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10" style={{ marginTop: "-2rem" }}>
          <Image src={anime.coverImage.extraLarge} alt={anime.title.romaji} width={176} height={264} className="object-cover w-full" />
        </div>

        <div className="flex-1 pt-24 md:pt-6">
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight leading-tight">{anime.title.english ?? anime.title.romaji}</h1>
          {anime.title.english && (
            <p className="text-sm text-muted-foreground mt-1">{anime.title.romaji}</p>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-3">
            {score && (
              <span className="inline-flex items-center gap-1 font-bold px-2.5 py-1 rounded-lg text-sm" style={{ backgroundColor: "var(--gold)", color: "#0A0A0A" }}>
                <Star size={12} strokeWidth={3} />
                {score}
              </span>
            )}
            {anime.startDate.year && (
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar size={12} />
                {anime.startDate.year}
              </span>
            )}
            {anime.episodes && (
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <PlayCircle size={12} />
                {anime.episodes} episodios
              </span>
            )}
            {anime.genres.length > 0 && <span className="text-muted-foreground/40 text-sm">·</span>}
            {anime.genres.slice(0, 4).map((g) => (
              <span key={g} className="border border-border/60 rounded-full px-2.5 py-0.5 text-xs text-muted-foreground">{translateGenre(g)}</span>
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

      <div className="px-6 mt-4">
        <ReviewSection mediaType="anime" externalId={animeId} />
      </div>
    </div>
  );
}

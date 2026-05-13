import { tmdbMovies, posterUrl, backdropUrl } from "@/lib/tmdb/client";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { WatchButton } from "@/components/media/WatchButton";
import { WatchlistButton } from "@/components/media/WatchlistButton";
import { ReviewSection } from "@/components/media/ReviewSection";
import { AddToListButton } from "@/components/lists/AddToListButton";
import { ScrollRow } from "@/components/ui/ScrollRow";
import { Star, Clock, Calendar, Users, Film } from "lucide-react";

export default async function MoviePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const movieId = Number(id);
  if (isNaN(movieId)) notFound();

  const [movie, credits] = await Promise.all([
    tmdbMovies.detail(movieId).catch(() => null),
    tmdbMovies.credits(movieId).catch(() => ({ cast: [], crew: [] })),
  ]);

  if (!movie) notFound();

  const director = credits.crew.find((c) => c.job === "Director") ?? null;

  const backdrop = backdropUrl(movie.backdrop_path);
  const poster = posterUrl(movie.poster_path, "w500");
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null;
  const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : null;
  const score = movie.vote_average ? (movie.vote_average).toFixed(1) : null;

  return (
    <div className="-mx-6 -mt-8">
      {/* Backdrop */}
      <div className="relative h-72 md:h-[420px] w-full overflow-hidden">
        {backdrop ? (
          <Image src={backdrop} alt={movie.title} fill className="object-cover" priority />
        ) : (
          <div className="h-full bg-secondary" />
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(10,10,10,0.1) 0%, rgba(10,10,10,0.5) 50%, #0A0A0A 100%)" }} />
      </div>

      {/* Content */}
      <div className="px-6 -mt-32 relative z-10 flex gap-6">
        {/* Poster */}
        {poster && (
          <div className="hidden md:block flex-shrink-0 w-44 rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10" style={{ marginTop: "-2rem" }}>
            <Image src={poster} alt={movie.title} width={176} height={264} className="object-cover w-full" />
          </div>
        )}

        <div className="flex-1 pt-24 md:pt-6">
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight leading-tight">{movie.title}</h1>

          <div className="flex flex-wrap items-center gap-2 mt-3">
            {score && (
              <span className="inline-flex items-center gap-1 font-bold px-2.5 py-1 rounded-lg text-sm" style={{ backgroundColor: "var(--gold)", color: "#0A0A0A" }}>
                <Star size={12} strokeWidth={3} />
                {score}
              </span>
            )}
            {year && (
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar size={12} />
                {year}
              </span>
            )}
            {runtime && (
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock size={12} />
                {runtime}
              </span>
            )}
            {(movie.genres?.length ?? 0) > 0 && <span className="text-muted-foreground/40 text-sm">·</span>}
            {movie.genres?.map((g) => (
              <span key={g.id} className="border border-border/60 rounded-full px-2.5 py-0.5 text-xs text-muted-foreground">{g.name}</span>
            ))}
          </div>

          {director && (
            <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
              <Film size={12} />
              <span>Dirección</span>
              <span className="opacity-40">·</span>
              <Link href={`/person/${director.id}`} className="text-foreground hover:text-[var(--gold)] transition-colors font-medium">
                {director.name}
              </Link>
            </div>
          )}

          {movie.overview && (
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-2xl">{movie.overview}</p>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            <WatchButton mediaType="movie" externalId={movieId} title={movie.title} />
            <WatchlistButton mediaType="movie" externalId={movieId} title={movie.title} />
            <AddToListButton mediaType="movie" externalId={movieId} />
          </div>
        </div>
      </div>

      <div className="px-6 mt-4">
        <ReviewSection mediaType="movie" externalId={movieId} />
      </div>

      {credits.cast.length > 0 && (
        <div className="px-6 mt-10">
          <div className="flex items-center gap-2 mb-4">
            <Users size={15} style={{ color: "var(--gold)" }} />
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Reparto</h2>
          </div>
          <ScrollRow>
            {credits.cast.slice(0, 20).map((p) => (
              <div key={p.id} className="flex-shrink-0 w-24 text-center">
                <Link href={`/person/${p.id}`} className="block">
                  <div className="w-24 h-24 rounded-full p-0.5 mx-auto hover:ring-2 hover:ring-offset-2 hover:ring-[var(--gold)] transition-all ring-offset-background">
                    <div className="w-full h-full rounded-full overflow-hidden bg-secondary">
                      {p.profile_path ? (
                        <Image
                          src={`https://image.tmdb.org/t/p/w185${p.profile_path}`}
                          alt={p.name}
                          width={96}
                          height={96}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <img src="/perfil2.jpg" alt="Usuario" className="w-full h-full object-cover" />
                      )}
                    </div>
                  </div>
                </Link>
                <p className="text-xs mt-1.5 font-medium truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground truncate">{p.character}</p>
              </div>
            ))}
          </ScrollRow>
        </div>
      )}
    </div>
  );
}

import { tmdbSeries, posterUrl, backdropUrl } from "@/lib/tmdb/client";
import { notFound } from "next/navigation";
import Image from "next/image";
import { WatchButton } from "@/components/media/WatchButton";

export default async function SeriesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const seriesId = Number(id);
  if (isNaN(seriesId)) notFound();

  const [series, credits] = await Promise.all([
    tmdbSeries.detail(seriesId).catch(() => null),
    tmdbSeries.credits(seriesId).catch(() => ({ cast: [] })),
  ]);

  if (!series) notFound();

  const backdrop = backdropUrl(series.backdrop_path);
  const poster = posterUrl(series.poster_path, "w500");
  const year = series.first_air_date ? new Date(series.first_air_date).getFullYear() : null;
  const score = series.vote_average ? (series.vote_average).toFixed(1) : null;

  return (
    <div className="-mx-6 -mt-8">
      <div className="relative h-72 md:h-96 w-full overflow-hidden">
        {backdrop ? (
          <Image src={backdrop} alt={series.name} fill className="object-cover" priority />
        ) : (
          <div className="h-full bg-secondary" />
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 30%, #0A0A0A 100%)" }} />
      </div>

      <div className="px-6 -mt-24 relative z-10 flex gap-6">
        {poster && (
          <div className="hidden md:block flex-shrink-0 w-40 rounded-lg overflow-hidden shadow-2xl">
            <Image src={poster} alt={series.name} width={160} height={240} className="object-cover w-full" />
          </div>
        )}

        <div className="flex-1 pt-20 md:pt-4">
          <h1 className="text-2xl md:text-3xl font-bold">{series.name}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
            {year && <span>{year}</span>}
            {series.number_of_seasons && (
              <span>{series.number_of_seasons} temporada{series.number_of_seasons !== 1 ? "s" : ""}</span>
            )}
            {score && (
              <span className="font-semibold px-2 py-0.5 rounded text-xs" style={{ backgroundColor: "var(--gold)", color: "#0A0A0A" }}>
                {score}
              </span>
            )}
            {series.genres?.map((g) => (
              <span key={g.id} className="border border-border rounded px-2 py-0.5 text-xs">{g.name}</span>
            ))}
          </div>

          {series.overview && (
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-2xl">{series.overview}</p>
          )}

          <div className="mt-5">
            <WatchButton mediaType="series" externalId={seriesId} title={series.name} />
          </div>
        </div>
      </div>

      {credits.cast.length > 0 && (
        <div className="px-6 mt-10">
          <h2 className="text-base font-semibold mb-3">Reparto</h2>
          <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
            {credits.cast.slice(0, 20).map((p) => (
              <div key={p.id} className="flex-shrink-0 w-24 text-center">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-secondary mx-auto">
                  {p.profile_path ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w185${p.profile_path}`}
                      alt={p.name}
                      width={96}
                      height={96}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl text-muted-foreground">👤</div>
                  )}
                </div>
                <p className="text-xs mt-1 font-medium truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground truncate">{p.character}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

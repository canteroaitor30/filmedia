import { tmdbPerson, posterUrl } from "@/lib/tmdb/client";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { TmdbPersonCredit } from "@/lib/tmdb/client";
import { MapPin, Calendar, Film, Tv, Video } from "lucide-react";

function CreditCard({ credit }: { credit: TmdbPersonCredit }) {
  const isMovie = credit.media_type === "movie";
  const title = credit.title ?? credit.name ?? "";
  const year = credit.release_date
    ? new Date(credit.release_date).getFullYear()
    : credit.first_air_date
    ? new Date(credit.first_air_date).getFullYear()
    : null;
  const href = isMovie ? `/movies/${credit.id}` : `/series/${credit.id}`;
  const poster = posterUrl(credit.poster_path, "w185");

  return (
    <Link href={href} className="flex-shrink-0 w-28 group">
      <div className="aspect-[2/3] rounded-lg overflow-hidden bg-secondary relative shadow-md">
        {poster ? (
          <Image
            src={poster}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs text-center p-2">
            {title}
          </div>
        )}
        <div className="absolute top-1.5 right-1.5">
          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold bg-black/70 text-white/90 backdrop-blur-sm">
            {isMovie ? "Peli" : "Serie"}
          </span>
        </div>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
      </div>
      <p className="text-xs mt-1.5 font-medium leading-tight line-clamp-2">{title}</p>
      {year && <p className="text-[10px] text-muted-foreground">{year}</p>}
      {(credit.character || credit.job) && (
        <p className="text-[10px] text-muted-foreground truncate italic">
          {credit.character ?? credit.job}
        </p>
      )}
    </Link>
  );
}

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span style={{ color: "var(--gold)" }}>{icon}</span>
      <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">{label}</h2>
    </div>
  );
}

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const personId = Number(id);
  if (isNaN(personId)) notFound();

  const [person, credits] = await Promise.all([
    tmdbPerson.detail(personId).catch(() => null),
    tmdbPerson.combinedCredits(personId).catch(() => ({ cast: [], crew: [] })),
  ]);

  if (!person) notFound();

  const profileImg = person.profile_path
    ? `https://image.tmdb.org/t/p/w342${person.profile_path}`
    : null;

  // Deduplicate and sort cast credits by vote_average desc, filter noise
  const seen = new Set<number>();
  const castCredits = credits.cast
    .filter((c) => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return c.poster_path && c.vote_average > 0;
    })
    .sort((a, b) => b.vote_average - a.vote_average);

  // Director/creator credits from crew (deduplicated)
  const seenCrew = new Set<number>();
  const crewCredits = credits.crew
    .filter((c) => {
      if (seenCrew.has(c.id)) return false;
      seenCrew.add(c.id);
      return (
        c.poster_path &&
        c.vote_average > 0 &&
        (c.job === "Director" || c.job === "Creator" || c.job === "Executive Producer")
      );
    })
    .sort((a, b) => b.vote_average - a.vote_average);

  const movieCast = castCredits.filter((c) => c.media_type === "movie");
  const tvCast = castCredits.filter((c) => c.media_type === "tv");

  const dept: Record<string, string> = {
    Acting: "Actor/Actriz",
    Directing: "Director/a",
    Writing: "Guionista",
    Production: "Producción",
  };
  const deptLabel = dept[person.known_for_department] ?? person.known_for_department;

  const birthYear = person.birthday ? new Date(person.birthday).getFullYear() : null;
  const age = birthYear ? new Date().getFullYear() - birthYear : null;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex gap-6 mb-10 pb-8 border-b border-border/50">
        <div className="flex-shrink-0">
          <div className="w-36 h-36 md:w-44 md:h-44 rounded-2xl overflow-hidden bg-secondary shadow-2xl ring-1 ring-white/10">
            {profileImg ? (
              <Image
                src={profileImg}
                alt={person.name}
                width={176}
                height={176}
                className="object-cover w-full h-full"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-muted-foreground">
                {person.name[0]}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 pt-2">
          <div className="flex flex-wrap items-start gap-3 mb-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{person.name}</h1>
            <span
              className="text-xs px-2.5 py-1 rounded-full font-semibold mt-0.5 flex-shrink-0"
              style={{ backgroundColor: "color-mix(in srgb, var(--gold) 15%, transparent)", color: "var(--gold)", border: "1px solid color-mix(in srgb, var(--gold) 30%, transparent)" }}
            >
              {deptLabel}
            </span>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
            {age && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={13} />
                {age} años
              </span>
            )}
            {person.place_of_birth && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={13} />
                {person.place_of_birth}
              </span>
            )}
          </div>

          {person.biography && (
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-5 max-w-2xl">
              {person.biography}
            </p>
          )}
        </div>
      </div>

      {/* Cast credits */}
      {movieCast.length > 0 && (
        <section className="mb-10">
          <SectionHeader icon={<Film size={15} />} label="Películas" />
          <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
            {movieCast.map((c) => (
              <CreditCard key={c.id} credit={c} />
            ))}
          </div>
        </section>
      )}

      {tvCast.length > 0 && (
        <section className="mb-10">
          <SectionHeader icon={<Tv size={15} />} label="Series" />
          <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
            {tvCast.map((c) => (
              <CreditCard key={c.id} credit={c} />
            ))}
          </div>
        </section>
      )}

      {crewCredits.length > 0 && (
        <section className="mb-10">
          <SectionHeader icon={<Video size={15} />} label="Como director/creador" />
          <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
            {crewCredits.map((c) => (
              <CreditCard key={c.id} credit={c} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

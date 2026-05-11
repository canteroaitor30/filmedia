import { createClient } from "@/lib/supabase/server";
import { tmdbMovies, tmdbSeries, posterUrl } from "@/lib/tmdb/client";
import { anilistAnime } from "@/lib/anilist/client";
import Link from "next/link";
import Image from "next/image";

interface Props {
  userId: string;
  isOwn: boolean;
}

export async function WatchlistTab({ userId, isOwn }: Props) {
  const supabase = await createClient();

  const { data: items } = await supabase
    .from("user_media")
    .select("media_type, external_id, status, rating, platform")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (!items?.length) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-4xl mb-3">🎬</p>
        <p>{isOwn ? "Aún no has añadido nada" : "Sin contenido aún"}</p>
      </div>
    );
  }

  const details = await Promise.all(
    items.map(async (item) => {
      try {
        if (item.media_type === "movie") {
          const m = await tmdbMovies.detail(item.external_id);
          return { ...item, title: m.title, poster: posterUrl(m.poster_path, "w185"), href: `/movies/${m.id}` };
        } else if (item.media_type === "series") {
          const s = await tmdbSeries.detail(item.external_id);
          return { ...item, title: s.name, poster: posterUrl(s.poster_path, "w185"), href: `/series/${s.id}` };
        } else {
          const a = await anilistAnime.detail(item.external_id);
          return { ...item, title: a.title.english ?? a.title.romaji, poster: a.coverImage.large, href: `/anime/${a.id}` };
        }
      } catch {
        return null;
      }
    })
  );

  const valid = details.filter(Boolean) as NonNullable<typeof details[0]>[];
  const watched = valid.filter((i) => i.status === "watched");
  const pending = valid.filter((i) => i.status === "pending");

  return (
    <div className="space-y-8">
      {watched.length > 0 && (
        <section>
          <h2 className="text-base font-semibold mb-4">Vistos <span className="text-muted-foreground font-normal text-sm">({watched.length})</span></h2>
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {watched.map((item) => (
              <Link key={`${item.media_type}-${item.external_id}`} href={item.href} className="group">
                <div className="aspect-[2/3] rounded overflow-hidden bg-secondary relative">
                  {item.poster
                    ? <Image src={item.poster} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform" sizes="120px" />
                    : <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground p-1 text-center">{item.title}</div>
                  }
                  {item.rating && (
                    <div className="absolute bottom-1 right-1 text-xs font-bold rounded px-1" style={{ backgroundColor: "var(--gold)", color: "#0A0A0A" }}>
                      {item.rating}★
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {pending.length > 0 && (
        <section>
          <h2 className="text-base font-semibold mb-4">Pendientes <span className="text-muted-foreground font-normal text-sm">({pending.length})</span></h2>
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {pending.map((item) => (
              <Link key={`${item.media_type}-${item.external_id}`} href={item.href} className="group">
                <div className="aspect-[2/3] rounded overflow-hidden bg-secondary relative">
                  {item.poster
                    ? <Image src={item.poster} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform" sizes="120px" />
                    : <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground p-1 text-center">{item.title}</div>
                  }
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

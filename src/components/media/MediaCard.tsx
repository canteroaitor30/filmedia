import Link from "next/link";
import Image from "next/image";
import type { UnifiedMedia } from "@/types/media";

interface Props {
  media: UnifiedMedia;
  showScore?: boolean;
}

export function MediaCard({ media, showScore = true }: Props) {
  const href = `/${media.type === "movie" ? "movies" : media.type === "series" ? "series" : "anime"}/${media.id}`;

  return (
    <Link href={href} className="group flex-shrink-0 w-36 md:w-40">
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-secondary shadow-md">
        {media.posterUrl ? (
          <Image
            src={media.posterUrl}
            alt={media.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="160px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-xs text-center p-2">
            {media.title}
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-300" />
        {showScore && media.score != null && (
          <div
            className="absolute bottom-2 right-2 rounded-lg px-1.5 py-0.5 text-xs font-bold shadow"
            style={{ backgroundColor: "var(--gold)", color: "#0A0A0A" }}
          >
            {(media.score / 10).toFixed(1)}
          </div>
        )}
      </div>
      <p className="mt-2 text-xs font-medium truncate group-hover:text-[var(--gold)] transition-colors duration-200">
        {media.title}
      </p>
      {media.year && (
        <p className="text-xs text-muted-foreground/60">{media.year}</p>
      )}
    </Link>
  );
}

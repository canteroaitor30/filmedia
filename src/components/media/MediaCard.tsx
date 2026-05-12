"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { UnifiedMedia } from "@/types/media";
import { saveWatchEntry } from "@/app/actions/watch";

interface Props {
  media: UnifiedMedia;
  showScore?: boolean;
}

const STARS = [1, 2, 3, 4, 5];

export function MediaCard({ media, showScore = true }: Props) {
  const [hoverRating, setHoverRating] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const href = `/${media.type === "movie" ? "movies" : media.type === "series" ? "series" : "anime"}/${media.id}`;

  function half(e: React.MouseEvent<HTMLButtonElement>, star: number) {
    const rect = e.currentTarget.getBoundingClientRect();
    return (e.clientX - rect.left) < rect.width / 2 ? star - 0.5 : star;
  }

  async function rate(e: React.MouseEvent<HTMLButtonElement>, star: number) {
    e.preventDefault();
    e.stopPropagation();
    const v = half(e, star);
    await saveWatchEntry({
      mediaType: media.type,
      externalId: media.id,
      status: "watched",
      rating: v,
      platform: null,
      title: media.title,
    });
    setHoverRating(0);
    setConfirmed(true);
    setTimeout(() => setConfirmed(false), 1500);
  }

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
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-colors duration-300" />

        {/* Rating overlay — slides up on hover */}
        <div
          className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 py-3 px-1"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)" }}
        >
          {confirmed ? (
            <p className="text-center text-xs font-semibold" style={{ color: "var(--gold)" }}>✓ Guardado</p>
          ) : (
            <div className="flex justify-center" style={{ gap: "2px" }} onMouseLeave={() => setHoverRating(0)}>
              {STARS.map((s) => {
                const fill = Math.min(Math.max(hoverRating - (s - 1), 0), 1);
                return (
                  <button
                    key={s}
                    onMouseMove={(e) => { e.preventDefault(); e.stopPropagation(); setHoverRating(half(e, s)); }}
                    onClick={(e) => rate(e, s)}
                    className="relative transition-transform hover:scale-110"
                    style={{ width: 16, height: 16, flexShrink: 0 }}
                    aria-label={`Valorar ${s}`}
                  >
                    <span className="absolute inset-0 flex items-center justify-center text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>★</span>
                    {fill > 0 && (
                      <span className="absolute inset-0 overflow-hidden flex items-center justify-center text-sm" style={{ width: fill >= 1 ? "100%" : "50%", color: "var(--gold)" }}>★</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {showScore && media.score != null && (
          <div
            className="absolute bottom-2 right-2 rounded-lg px-1.5 py-0.5 text-xs font-bold shadow group-hover:opacity-0 transition-opacity duration-200"
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

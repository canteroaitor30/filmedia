"use client";

import { useRef } from "react";
import { MediaCard } from "./MediaCard";
import type { UnifiedMedia } from "@/types/media";

interface Props {
  title: string;
  items: UnifiedMedia[];
}

export function Carousel({ title, items }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  if (!items.length) return null;

  function scroll(dir: "left" | "right") {
    if (!ref.current) return;
    ref.current.scrollBy({ left: dir === "right" ? 600 : -600, behavior: "smooth" });
  }

  return (
    <section>
      <h2 className="text-base font-semibold mb-3 px-1">{title}</h2>
      <div className="relative group/carousel">
        <div ref={ref} className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
          {items.map((item) => (
            <MediaCard key={`${item.type}-${item.id}`} media={item} />
          ))}
        </div>

        {/* Flecha izquierda */}
        <button
          onClick={() => scroll("left")}
          aria-label="Anterior"
          className="absolute left-0 top-0 bottom-3 w-16 flex items-center justify-start pl-1 opacity-0 group-hover/carousel:opacity-100 transition-opacity"
          style={{ background: "linear-gradient(to right, rgba(10,10,10,0.85) 0%, transparent 100%)" }}
        >
          <span className="text-2xl text-white drop-shadow">‹</span>
        </button>

        {/* Flecha derecha */}
        <button
          onClick={() => scroll("right")}
          aria-label="Siguiente"
          className="absolute right-0 top-0 bottom-3 w-16 flex items-center justify-end pr-1 opacity-0 group-hover/carousel:opacity-100 transition-opacity"
          style={{ background: "linear-gradient(to left, rgba(10,10,10,0.85) 0%, transparent 100%)" }}
        >
          <span className="text-2xl text-white drop-shadow">›</span>
        </button>
      </div>
    </section>
  );
}

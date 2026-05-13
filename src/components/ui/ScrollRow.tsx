"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function ScrollRow({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  function scroll(dir: "left" | "right") {
    ref.current?.scrollBy({ left: dir === "right" ? 600 : -600, behavior: "smooth" });
  }

  return (
    <div className="relative group/carousel">
      <div ref={ref} className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
        {children}
      </div>

      <button
        onClick={() => scroll("left")}
        aria-label="Anterior"
        className="absolute left-0 top-0 bottom-3 w-14 flex items-center justify-start pl-1 opacity-0 group-hover/carousel:opacity-100 transition-opacity"
        style={{ background: "linear-gradient(to right, rgba(10,10,10,0.9) 0%, transparent 100%)" }}
      >
        <span className="w-7 h-7 flex items-center justify-center rounded-full bg-background/80 border border-border/60 text-foreground shadow">
          <ChevronLeft size={14} />
        </span>
      </button>

      <button
        onClick={() => scroll("right")}
        aria-label="Siguiente"
        className="absolute right-0 top-0 bottom-3 w-14 flex items-center justify-end pr-1 opacity-0 group-hover/carousel:opacity-100 transition-opacity"
        style={{ background: "linear-gradient(to left, rgba(10,10,10,0.9) 0%, transparent 100%)" }}
      >
        <span className="w-7 h-7 flex items-center justify-center rounded-full bg-background/80 border border-border/60 text-foreground shadow">
          <ChevronRight size={14} />
        </span>
      </button>
    </div>
  );
}

"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";
import { translateGenre } from "@/lib/anilist/client";

interface Props {
  platforms: string[];
  genres: string[];
  decades: string[];
  mode: "historial" | "watchlist";
  currentFilters: {
    type: string;
    rating: string;
    platform: string;
    genre: string;
    year: string;
    sort: string;
  };
}

function GoldSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = !!value;
  const selectedLabel = options.find((o) => o.value === value)?.label;

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full pl-3 pr-2.5 h-8 text-xs border border-dashed transition-all"
        style={{
          borderColor: "var(--gold)",
          color: "var(--gold)",
          backgroundColor: "#0A0A0A",
          borderStyle: active ? "solid" : "dashed",
        }}
      >
        <span>{active ? selectedLabel : label}</span>
        {active ? (
          <X
            width={11}
            height={11}
            className="flex-shrink-0 opacity-70 hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
              setOpen(false);
            }}
          />
        ) : (
          <ChevronDown width={11} height={11} className="flex-shrink-0 opacity-70" />
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 rounded-xl border border-border bg-[#0A0A0A] shadow-xl py-1 min-w-full">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-secondary transition-colors whitespace-nowrap"
              style={opt.value === value ? { color: "var(--gold)" } : undefined}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function WatchlistFilters({ platforms, genres, decades, mode, currentFilters }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const update = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, searchParams]);

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <GoldSelect
        label="Tipo"
        value={currentFilters.type}
        onChange={(v) => update("type", v)}
        options={[
          { value: "movie", label: "Películas" },
          { value: "series", label: "Series" },
          { value: "anime", label: "Anime" },
        ]}
      />

      {mode === "historial" && (
        <GoldSelect
          label="Valoración"
          value={currentFilters.rating}
          onChange={(v) => update("rating", v)}
          options={[
            { value: "5", label: "5★" },
            { value: "4", label: "4★ o más" },
            { value: "3", label: "3★ o más" },
          ]}
        />
      )}

      {genres.length > 0 && (
        <GoldSelect
          label="Género"
          value={currentFilters.genre}
          onChange={(v) => update("genre", v)}
          options={genres.map((g) => ({ value: g, label: translateGenre(g) }))}
        />
      )}

      {decades.length > 0 && (
        <GoldSelect
          label="Década"
          value={currentFilters.year}
          onChange={(v) => update("year", v)}
          options={decades.map((d) => ({ value: d, label: `Años ${d}s` }))}
        />
      )}

      {mode === "historial" && (
        <div className="ml-auto">
          <GoldSelect
            label="Orden"
            value={currentFilters.sort}
            onChange={(v) => update("sort", v)}
            options={[
              { value: "desc", label: "Mayor valoración" },
              { value: "asc", label: "Menor valoración" },
            ]}
          />
        </div>
      )}
    </div>
  );
}

"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface Props {
  platforms: string[];
  currentFilters: {
    type: string;
    status: string;
    rating: string;
    platform: string;
  };
}

export function WatchlistFilters({ platforms, currentFilters }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const update = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, searchParams]);

  const pill = (active: boolean) =>
    `px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
      active
        ? "text-[#0A0A0A]"
        : "bg-secondary text-muted-foreground hover:text-foreground"
    }`;

  return (
    <div className="space-y-3 mb-6">
      {/* Tipo */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-muted-foreground w-16">Tipo</span>
        {[
          { label: "Todo", value: "all" },
          { label: "Películas", value: "movie" },
          { label: "Series", value: "series" },
          { label: "Anime", value: "anime" },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => update("type", opt.value)}
            className={pill(currentFilters.type === opt.value || (opt.value === "all" && !currentFilters.type))}
            style={currentFilters.type === opt.value || (opt.value === "all" && !currentFilters.type)
              ? { backgroundColor: "var(--gold)" } : {}}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Estado */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-muted-foreground w-16">Estado</span>
        {[
          { label: "Todo", value: "all" },
          { label: "Vistos", value: "watched" },
          { label: "Pendientes", value: "pending" },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => update("status", opt.value)}
            className={pill(currentFilters.status === opt.value || (opt.value === "all" && !currentFilters.status))}
            style={currentFilters.status === opt.value || (opt.value === "all" && !currentFilters.status)
              ? { backgroundColor: "var(--gold)" } : {}}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Nota */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-muted-foreground w-16">Nota</span>
        {[
          { label: "Todas", value: "all" },
          { label: "5★", value: "5" },
          { label: "4★+", value: "4" },
          { label: "3★+", value: "3" },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => update("rating", opt.value)}
            className={pill(currentFilters.rating === opt.value || (opt.value === "all" && !currentFilters.rating))}
            style={currentFilters.rating === opt.value || (opt.value === "all" && !currentFilters.rating)
              ? { backgroundColor: "var(--gold)" } : {}}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Plataforma */}
      {platforms.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-muted-foreground w-16">Plataforma</span>
          <button
            onClick={() => update("platform", "all")}
            className={pill(!currentFilters.platform)}
            style={!currentFilters.platform ? { backgroundColor: "var(--gold)" } : {}}
          >
            Todas
          </button>
          {platforms.map((p) => (
            <button
              key={p}
              onClick={() => update("platform", p)}
              className={pill(currentFilters.platform === p)}
              style={currentFilters.platform === p ? { backgroundColor: "var(--gold)" } : {}}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Search, Film, Tv, User, X } from "lucide-react";
import type { QuickResult } from "@/app/api/search/route";

type SearchResponse = { content: QuickResult[]; persons: QuickResult[] };

const TYPE_ICON: Record<QuickResult["type"], React.ReactNode> = {
  movie: <Film size={13} />,
  series: <Tv size={13} />,
  person: <User size={13} />,
};

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<SearchResponse>({ content: [], persons: [] });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setOpen(true); }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  function close() { setOpen(false); setQuery(""); setData({ content: [], persons: [] }); }

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (query.trim().length < 2) { setData({ content: [], persons: [] }); setLoading(false); return; }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        setData(await res.json());
      } catch {
        setData({ content: [], persons: [] });
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    close();
  }

  const hasResults = data.content.length > 0 || data.persons.length > 0;
  const showPanel = query.trim().length >= 2;

  const modal = open && (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm"
      onClick={close}
    >
      <div
        className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <form onSubmit={submit}>
          <div className="flex items-center gap-3 px-4 py-3.5">
            <Search size={16} className="text-muted-foreground flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar películas, series, personas..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              autoComplete="off"
            />
            {query
              ? <button type="button" onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground transition-colors"><X size={15} /></button>
              : <kbd className="text-[11px] border border-border/60 rounded px-1.5 py-0.5 text-muted-foreground">Esc</kbd>
            }
          </div>
        </form>

        {/* Results panel */}
        {showPanel && (
          <div className="border-t border-border/60 max-h-[420px] overflow-y-auto">
            {loading ? (
              <p className="text-xs text-muted-foreground text-center py-6">Buscando...</p>
            ) : !hasResults ? (
              <p className="text-xs text-muted-foreground text-center py-6">Sin resultados para &ldquo;{query}&rdquo;</p>
            ) : (
              <>
                {/* Content: movies + series sorted by popularity */}
                {data.content.length > 0 && (
                  <div>
                    {data.content.map((r) => (
                      <ResultRow key={`${r.type}-${r.id}`} result={r} onClose={close} />
                    ))}
                  </div>
                )}

                {/* Persons */}
                {data.persons.length > 0 && (
                  <div className={data.content.length > 0 ? "border-t border-border/40" : ""}>
                    <p className="px-4 pt-2.5 pb-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">Personas</p>
                    {data.persons.map((r) => (
                      <ResultRow key={`person-${r.id}`} result={r} onClose={close} />
                    ))}
                  </div>
                )}

                {/* Ver todos */}
                <Link
                  href={`/search?q=${encodeURIComponent(query.trim())}`}
                  onClick={close}
                  className="flex items-center justify-center gap-2 px-4 py-3 border-t border-border/60 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-colors"
                >
                  <Search size={12} />
                  Ver todos los resultados de &ldquo;{query.trim()}&rdquo;
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center text-muted-foreground hover:text-foreground transition-colors" aria-label="Buscar">
        <Search size={18} />
      </button>
      {mounted && createPortal(modal, document.body)}
    </>
  );
}

function ResultRow({ result, onClose }: { result: QuickResult; onClose: () => void }) {
  const isPerson = result.type === "person";
  return (
    <Link
      href={result.href}
      onClick={onClose}
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/50 transition-colors"
    >
      <div className={`flex-shrink-0 bg-secondary overflow-hidden flex items-center justify-center text-muted-foreground ${isPerson ? "w-8 h-8 rounded-full" : "w-8 h-11 rounded-md"}`}>
        {result.posterUrl
          ? <img src={result.posterUrl} alt={result.title} className="w-full h-full object-cover" />
          : TYPE_ICON[result.type]
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate leading-tight">{result.title}</p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{result.subtitle}</p>
      </div>
    </Link>
  );
}

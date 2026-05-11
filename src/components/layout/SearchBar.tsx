"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    setOpen(false);
    setQuery("");
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
      >
        <span>🔍</span>
        <span className="hidden sm:inline">Buscar</span>
        <kbd className="hidden sm:inline text-xs border border-border rounded px-1">⌘K</kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/60" onClick={() => setOpen(false)}>
          <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={submit}>
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <span className="text-muted-foreground">🔍</span>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar películas, series, anime..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  autoComplete="off"
                />
                {query && (
                  <button type="button" onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground text-lg leading-none">
                    ×
                  </button>
                )}
              </div>
              <div className="px-4 py-2 flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Pulsa Enter para buscar</span>
                <kbd className="text-xs border border-border rounded px-1 text-muted-foreground">Esc</kbd>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { saveWatchEntry, deleteWatchEntry } from "@/app/actions/watch";
import type { MediaType, Platform } from "@/types/database";
import { Eye, Star } from "lucide-react";

const PLATFORMS: Platform[] = [
  "Netflix", "HBO Max", "Prime", "Disney+", "Apple TV+",
  "Filmin", "Movistar+", "Crunchyroll", "Cine", "Otro",
];

interface Props {
  mediaType: MediaType;
  externalId: number;
  title: string;
}

export function WatchButton({ mediaType, externalId, title }: Props) {
  const [entryId, setEntryId] = useState<string | null>(null);
  const [isWatched, setIsWatched] = useState(false);
  const [currentRating, setCurrentRating] = useState<number | null>(null);
  const [currentPlatform, setCurrentPlatform] = useState<Platform | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from("user_media")
        .select("id, status, rating, platform")
        .eq("user_id", user.id)
        .eq("media_type", mediaType)
        .eq("external_id", externalId)
        .maybeSingle();
      if (data && data.status === "watched") {
        setEntryId(data.id);
        setIsWatched(true);
        setCurrentRating(data.rating);
        setCurrentPlatform(data.platform);
        setRating(data.rating);
        setPlatform(data.platform);
      }
      setLoading(false);
    }
    load();
  }, [externalId, mediaType]);

  async function save() {
    setSaving(true);
    const result = await saveWatchEntry({
      mediaType, externalId, status: "watched", rating, platform, title,
      entryId: entryId ?? undefined,
    });
    if (result.id) setEntryId(result.id);
    setIsWatched(true);
    setCurrentRating(rating);
    setCurrentPlatform(platform);
    setShowModal(false);
    setSaving(false);
  }

  async function remove() {
    if (!entryId) return;
    setSaving(true);
    await deleteWatchEntry(entryId);
    setEntryId(null);
    setIsWatched(false);
    setCurrentRating(null);
    setCurrentPlatform(null);
    setRating(null);
    setPlatform(null);
    setShowModal(false);
    setSaving(false);
  }

  if (loading) return <div className="h-9 w-28 rounded-lg bg-secondary animate-pulse" />;

  return (
    <>
      <button
        onClick={() => { setRating(currentRating); setPlatform(currentPlatform); setShowModal(true); }}
        className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all hover:brightness-110 active:scale-[0.97]"
        style={isWatched
          ? { backgroundColor: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }
          : { backgroundColor: "var(--gold)", color: "#0A0A0A" }}
      >
        {isWatched
          ? (
            <>
              <Eye size={14} />
              {currentRating ? `${currentRating}★` : "Visto"}
            </>
          )
          : (
            <>
              <Eye size={14} />
              Valorar
            </>
          )
        }
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowModal(false)}>
          <div className="bg-card border border-border/60 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold mb-1 truncate">{title}</h3>
            <p className="text-xs text-muted-foreground mb-5">Registra tu valoración</p>

            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Nota (opcional)</p>
            <div className="flex gap-1.5 mb-5 flex-wrap">
              {[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((r) => (
                <button key={r} onClick={() => setRating(rating === r ? null : r)}
                  className="inline-flex items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-medium border transition-all hover:scale-105 active:scale-95"
                  style={rating === r
                    ? { backgroundColor: "var(--gold)", color: "#0A0A0A", borderColor: "var(--gold)" }
                    : { borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
                  <Star size={9} strokeWidth={rating === r ? 3 : 2} />
                  {r}
                </button>
              ))}
            </div>

            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Plataforma (opcional)</p>
            <select value={platform ?? ""} onChange={(e) => setPlatform(e.target.value as Platform || null)}
              className="w-full rounded-lg border border-border/60 bg-secondary/60 px-3 py-2 text-sm mb-5 outline-none focus:border-[var(--gold)]/60 transition-colors">
              <option value="">— Sin especificar —</option>
              {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>

            <div className="flex gap-2">
              <button onClick={save} disabled={saving}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 transition-all hover:brightness-110 active:scale-[0.98]"
                style={{ backgroundColor: "var(--gold)", color: "#0A0A0A" }}>
                {saving ? "Guardando..." : "Guardar"}
              </button>
              {entryId && (
                <button onClick={remove} disabled={saving}
                  className="px-4 py-2.5 rounded-lg text-sm border border-border/60 text-muted-foreground hover:text-destructive hover:border-destructive transition-colors">
                  Eliminar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

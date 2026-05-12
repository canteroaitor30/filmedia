"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { saveWatchEntry, deleteWatchEntry } from "@/app/actions/watch";
import type { MediaType, Platform } from "@/types/database";

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

  if (loading) return <div className="h-9 w-24 rounded-md bg-secondary animate-pulse" />;

  const label = isWatched
    ? currentRating ? `${currentRating}★` : "Visto"
    : "Valorar";

  return (
    <>
      <button
        onClick={() => { setRating(currentRating); setPlatform(currentPlatform); setShowModal(true); }}
        className="rounded-md px-4 py-2 text-sm font-semibold transition-colors"
        style={isWatched
          ? { backgroundColor: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }
          : { backgroundColor: "var(--gold)", color: "#0A0A0A" }}
      >
        {label}
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold mb-4 truncate">{title}</h3>

            <p className="text-xs text-muted-foreground mb-2">Nota (opcional)</p>
            <div className="flex gap-1 mb-5 flex-wrap">
              {[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((r) => (
                <button key={r} onClick={() => setRating(rating === r ? null : r)}
                  className="px-2 py-1 rounded text-xs border transition-colors"
                  style={rating === r
                    ? { backgroundColor: "var(--gold)", color: "#0A0A0A", borderColor: "var(--gold)" }
                    : { borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
                  {r}★
                </button>
              ))}
            </div>

            <p className="text-xs text-muted-foreground mb-2">Plataforma (opcional)</p>
            <select value={platform ?? ""} onChange={(e) => setPlatform(e.target.value as Platform || null)}
              className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm mb-5">
              <option value="">— Sin especificar —</option>
              {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>

            <div className="flex gap-2">
              <button onClick={save} disabled={saving}
                className="flex-1 py-2 rounded-md text-sm font-semibold disabled:opacity-50"
                style={{ backgroundColor: "var(--gold)", color: "#0A0A0A" }}>
                {saving ? "Guardando..." : "Guardar"}
              </button>
              {entryId && (
                <button onClick={remove} disabled={saving}
                  className="px-4 py-2 rounded-md text-sm border border-border text-muted-foreground hover:text-destructive hover:border-destructive transition-colors">
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

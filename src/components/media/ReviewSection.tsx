"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { MediaType, PrivacyLevel } from "@/types/database";

interface Review {
  id: string;
  content: string;
  has_spoilers: boolean;
  privacy: PrivacyLevel;
  edited_at: string | null;
  created_at: string;
}

interface Props {
  mediaType: MediaType;
  externalId: number;
}

const PRIVACY_LABELS: Record<PrivacyLevel, string> = {
  private: "Solo yo",
  followers: "Seguidores",
  public: "Público",
};

export function ReviewSection({ mediaType, externalId }: Props) {
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState("");
  const [hasSpoilers, setHasSpoilers] = useState(false);
  const [privacy, setPrivacy] = useState<PrivacyLevel>("followers");
  const [saving, setSaving] = useState(false);
  const [spoilerRevealed, setSpoilerRevealed] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from("reviews")
        .select("id, content, has_spoilers, privacy, edited_at, created_at")
        .eq("user_id", user.id)
        .eq("media_type", mediaType)
        .eq("external_id", externalId)
        .single();
      if (data) {
        setReview(data);
        setContent(data.content);
        setHasSpoilers(data.has_spoilers);
        setPrivacy(data.privacy);
      }
      setLoading(false);
    }
    load();
  }, [externalId, mediaType]);

  async function save() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !content.trim()) return;

    if (review) {
      await supabase.from("reviews").update({
        content: content.trim(),
        has_spoilers: hasSpoilers,
        privacy,
        edited_at: new Date().toISOString(),
      }).eq("id", review.id);
      setReview({ ...review, content: content.trim(), has_spoilers: hasSpoilers, privacy, edited_at: new Date().toISOString() });
    } else {
      const { data } = await supabase.from("reviews").insert({
        user_id: user.id, media_type: mediaType, external_id: externalId,
        content: content.trim(), has_spoilers: hasSpoilers, privacy,
      }).select().single();
      if (data) setReview(data);
    }
    setEditing(false);
    setSaving(false);
  }

  async function remove() {
    if (!review) return;
    await supabase.from("reviews").delete().eq("id", review.id);
    setReview(null);
    setContent("");
    setEditing(false);
  }

  if (loading) return null;

  return (
    <div className="mt-8 border-t border-border pt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold">Mi reseña</h2>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-sm px-3 py-1 rounded-md border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            {review ? "Editar" : "+ Escribir reseña"}
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escribe tu reseña... Puedes usar **negrita**, *cursiva*"
            rows={5}
            className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring resize-none"
          />
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasSpoilers}
                onChange={(e) => setHasSpoilers(e.target.checked)}
                className="accent-yellow-400"
              />
              <span className="text-muted-foreground">Contiene spoilers</span>
            </label>
            <select
              value={privacy}
              onChange={(e) => setPrivacy(e.target.value as PrivacyLevel)}
              className="rounded border border-border bg-secondary px-2 py-1 text-xs"
            >
              {(["private", "followers", "public"] as PrivacyLevel[]).map((p) => (
                <option key={p} value={p}>{PRIVACY_LABELS[p]}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving || !content.trim()}
              className="px-4 py-1.5 rounded-md text-sm font-semibold disabled:opacity-50"
              style={{ backgroundColor: "var(--gold)", color: "#0A0A0A" }}
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
            <button onClick={() => { setEditing(false); if (review) { setContent(review.content); setHasSpoilers(review.has_spoilers); setPrivacy(review.privacy); } }} className="px-4 py-1.5 rounded-md text-sm border border-border text-muted-foreground hover:text-foreground transition-colors">
              Cancelar
            </button>
            {review && (
              <button onClick={remove} className="px-4 py-1.5 rounded-md text-sm border border-border text-muted-foreground hover:text-destructive hover:border-destructive transition-colors ml-auto">
                Eliminar
              </button>
            )}
          </div>
        </div>
      ) : review ? (
        <div>
          {review.has_spoilers && !spoilerRevealed ? (
            <div
              className="rounded-lg border border-border bg-secondary p-4 cursor-pointer text-center"
              onClick={() => setSpoilerRevealed(true)}
            >
              <p className="text-sm text-muted-foreground">⚠️ Esta reseña contiene spoilers</p>
              <p className="text-xs text-muted-foreground mt-1">Pulsa para revelar</p>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {review.content}
            </div>
          )}
          <div className="flex gap-3 mt-2 text-xs text-muted-foreground/60">
            <span>{PRIVACY_LABELS[review.privacy]}</span>
            {review.edited_at && <span>· Editado {new Date(review.edited_at).toLocaleDateString("es-ES")}</span>}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No has escrito una reseña todavía.</p>
      )}
    </div>
  );
}

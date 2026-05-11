"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { PrivacyLevel } from "@/types/database";

export function CreateListButton() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState<PrivacyLevel>("private");
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("custom_lists").insert({
      user_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      privacy,
    }).select().single();
    setSaving(false);
    setOpen(false);
    setTitle(""); setDescription(""); setPrivacy("private");
    if (data) router.push(`/lists/${data.id}`);
    else router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-md text-sm font-semibold"
        style={{ backgroundColor: "var(--gold)", color: "#0A0A0A" }}
      >
        + Nueva lista
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setOpen(false)}>
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold mb-4">Nueva lista</h3>
            <form onSubmit={create} className="space-y-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nombre de la lista"
                required
                className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción (opcional)"
                rows={2}
                className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring resize-none"
              />
              <select
                value={privacy}
                onChange={(e) => setPrivacy(e.target.value as PrivacyLevel)}
                className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm"
              >
                <option value="private">🔒 Solo yo</option>
                <option value="followers">👥 Seguidores</option>
                <option value="public">🌍 Público</option>
              </select>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={saving || !title.trim()} className="flex-1 py-2 rounded-md text-sm font-semibold disabled:opacity-50" style={{ backgroundColor: "var(--gold)", color: "#0A0A0A" }}>
                  {saving ? "Creando..." : "Crear"}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-md text-sm border border-border text-muted-foreground">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

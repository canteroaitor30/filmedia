"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { PrivacyLevel } from "@/types/database";
import { Plus, X, Globe, Users, Lock } from "lucide-react";

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
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase.from("custom_lists").insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        privacy,
      }).select().maybeSingle();
      if (error) return;
      setOpen(false);
      setTitle(""); setDescription(""); setPrivacy("private");
      if (data) router.push(`/lists/${data.id}`);
      else router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const PRIVACY_OPTIONS: { value: PrivacyLevel; label: string; icon: React.ReactNode }[] = [
    { value: "private", label: "Solo yo", icon: <Lock size={12} /> },
    { value: "followers", label: "Seguidores", icon: <Users size={12} /> },
    { value: "public", label: "Público", icon: <Globe size={12} /> },
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:brightness-110 active:scale-[0.97]"
        style={{ backgroundColor: "var(--gold)", color: "#0A0A0A" }}
      >
        <Plus size={14} strokeWidth={2.5} />
        Nueva lista
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setOpen(false)}>
          <div className="bg-card border border-border/60 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-base">Nueva lista</h3>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={create} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Nombre</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Mi lista de favoritos"
                  required
                  className="w-full rounded-lg border border-border/60 bg-secondary/60 px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-[var(--gold)]/60 focus:ring-1 focus:ring-[var(--gold)]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Descripción (opcional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe tu lista..."
                  rows={2}
                  className="w-full rounded-lg border border-border/60 bg-secondary/60 px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-[var(--gold)]/60 focus:ring-1 focus:ring-[var(--gold)]/30 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Privacidad</label>
                <div className="flex gap-2">
                  {PRIVACY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPrivacy(opt.value)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border transition-all"
                      style={privacy === opt.value
                        ? { borderColor: "var(--gold)", color: "var(--gold)", backgroundColor: "color-mix(in srgb, var(--gold) 8%, transparent)" }
                        : { borderColor: "var(--border)", color: "var(--muted-foreground)" }}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={saving || !title.trim()}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 transition-all hover:brightness-110 active:scale-[0.98]"
                  style={{ backgroundColor: "var(--gold)", color: "#0A0A0A" }}
                >
                  {saving ? "Creando..." : "Crear lista"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2.5 rounded-lg text-sm border border-border/60 text-muted-foreground hover:text-foreground transition-colors"
                >
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

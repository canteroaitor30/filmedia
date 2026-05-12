"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { MediaType } from "@/types/database";
import { ListPlus, Check, Plus, X } from "lucide-react";

interface Props {
  mediaType: MediaType;
  externalId: number;
}

export function AddToListButton({ mediaType, externalId }: Props) {
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState<{ id: string; title: string; hasItem: boolean }[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function loadLists() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: myLists } = await supabase.from("custom_lists").select("id, title").eq("user_id", user.id);
      const { data: existing } = await supabase.from("custom_list_items")
        .select("list_id").eq("media_type", mediaType).eq("external_id", externalId);
      const existingIds = new Set(existing?.map((e) => e.list_id));
      setLists((myLists ?? []).map((l) => ({ ...l, hasItem: existingIds.has(l.id) })));
    } finally {
      setLoading(false);
    }
  }

  async function toggle(listId: string, hasItem: boolean) {
    if (hasItem) {
      await supabase.from("custom_list_items").delete()
        .eq("list_id", listId).eq("media_type", mediaType).eq("external_id", externalId);
    } else {
      const { data: last } = await supabase.from("custom_list_items")
        .select("position").eq("list_id", listId).order("position", { ascending: false }).limit(1).maybeSingle();
      await supabase.from("custom_list_items").insert({
        list_id: listId, media_type: mediaType, external_id: externalId,
        position: (last?.position ?? 0) + 1,
      });
    }
    setLists((prev) => prev.map((l) => l.id === listId ? { ...l, hasItem: !hasItem } : l));
  }

  function handleOpen() {
    setOpen(true);
    loadLists();
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold border border-border/60 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
      >
        <ListPlus size={14} />
        Lista
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setOpen(false)}>
          <div className="bg-card border border-border/60 rounded-2xl p-5 w-full max-w-xs shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Añadir a lista</h3>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X size={16} />
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-6">
                <div className="w-5 h-5 rounded-full border-2 border-border border-t-foreground animate-spin" />
              </div>
            ) : !lists.length ? (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-sm">No tienes listas.</p>
                <a href="/lists" className="text-sm mt-1 block" style={{ color: "var(--gold)" }}>Crear una lista</a>
              </div>
            ) : (
              <div className="space-y-1.5">
                {lists.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => toggle(l.id, l.hasItem)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all text-sm hover:scale-[1.01] active:scale-[0.98]"
                    style={l.hasItem
                      ? { borderColor: "var(--gold)", color: "var(--gold)", backgroundColor: "color-mix(in srgb, var(--gold) 8%, transparent)" }
                      : { borderColor: "var(--border)", color: "var(--foreground)" }}
                  >
                    <span className="truncate">{l.title}</span>
                    {l.hasItem
                      ? <Check size={14} className="flex-shrink-0 ml-2" />
                      : <Plus size={14} className="flex-shrink-0 ml-2 opacity-50" />
                    }
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

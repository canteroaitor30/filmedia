"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { MediaType } from "@/types/database";

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
        className="rounded-md px-4 py-2 text-sm font-semibold border border-border text-muted-foreground hover:text-foreground transition-colors"
      >
        + Lista
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setOpen(false)}>
          <div className="bg-card border border-border rounded-xl p-5 w-full max-w-xs" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold mb-4">Añadir a lista</h3>
            {loading ? (
              <p className="text-sm text-muted-foreground">Cargando...</p>
            ) : !lists.length ? (
              <p className="text-sm text-muted-foreground">No tienes listas. Crea una en <a href="/lists" className="underline">Mis listas</a>.</p>
            ) : (
              <div className="space-y-2">
                {lists.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => toggle(l.id, l.hasItem)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-md border transition-colors text-sm"
                    style={l.hasItem ? { borderColor: "var(--gold)", color: "var(--gold)" } : { borderColor: "var(--border)", color: "var(--foreground)" }}
                  >
                    <span>{l.title}</span>
                    <span>{l.hasItem ? "✓" : "+"}</span>
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setOpen(false)} className="mt-4 w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
}

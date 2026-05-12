"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { saveWatchEntry, deleteWatchEntry } from "@/app/actions/watch";
import type { MediaType } from "@/types/database";

interface Props {
  mediaType: MediaType;
  externalId: number;
  title: string;
}

export function WatchlistButton({ mediaType, externalId, title }: Props) {
  const [entryId, setEntryId] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from("user_media")
        .select("id, status")
        .eq("user_id", user.id)
        .eq("media_type", mediaType)
        .eq("external_id", externalId)
        .eq("status", "pending")
        .maybeSingle();
      if (data) {
        setEntryId(data.id);
        setIsPending(true);
      }
      setLoading(false);
    }
    load();
  }, [externalId, mediaType]);

  async function toggle() {
    setSaving(true);
    if (isPending && entryId) {
      await deleteWatchEntry(entryId);
      setEntryId(null);
      setIsPending(false);
    } else {
      const result = await saveWatchEntry({
        mediaType, externalId, status: "pending", rating: null, platform: null, title,
      });
      if (result.id) setEntryId(result.id);
      setIsPending(true);
    }
    setSaving(false);
  }

  if (loading) return <div className="h-9 w-28 rounded-md bg-secondary animate-pulse" />;

  return (
    <button
      onClick={toggle}
      disabled={saving}
      className="rounded-md px-4 py-2 text-sm font-semibold border transition-colors disabled:opacity-50"
      style={isPending
        ? { backgroundColor: "var(--secondary)", color: "var(--foreground)", borderColor: "var(--border)" }
        : { borderColor: "var(--gold)", color: "var(--gold)", backgroundColor: "transparent" }}
    >
      {isPending ? "✓ Watchlist" : "+ Watchlist"}
    </button>
  );
}

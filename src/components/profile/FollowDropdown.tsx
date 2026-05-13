"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { User } from "lucide-react";

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface Props {
  userId: string;
  count: number;
  type: "followers" | "following";
}

export function FollowDropdown({ userId, count, type }: Props) {
  const [open, setOpen] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function handleOpen() {
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (profiles.length > 0) return;
    setLoading(true);
    const supabase = createClient();
    if (type === "followers") {
      const { data } = await supabase
        .from("follows")
        .select("profiles!follower_id(id, username, display_name, avatar_url)")
        .eq("following_id", userId)
        .limit(50);
      setProfiles((data ?? []).map((r: any) => r.profiles).filter(Boolean));
    } else {
      const { data } = await supabase
        .from("follows")
        .select("profiles!following_id(id, username, display_name, avatar_url)")
        .eq("follower_id", userId)
        .limit(50);
      setProfiles((data ?? []).map((r: any) => r.profiles).filter(Boolean));
    }
    setLoading(false);
  }

  const label = type === "followers" ? "seguidores" : "siguiendo";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className="hover:text-foreground transition-colors"
      >
        <strong className="font-bold tabular-nums">{count}</strong>{" "}
        <span className="text-muted-foreground">{label}</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 z-50 w-56 rounded-xl border border-border bg-card shadow-xl py-1 max-h-72 overflow-y-auto">
          {loading ? (
            <p className="text-xs text-muted-foreground px-3 py-2">Cargando...</p>
          ) : profiles.length === 0 ? (
            <p className="text-xs text-muted-foreground px-3 py-2">Sin {label} aún</p>
          ) : (
            profiles.map((p) => (
              <Link
                key={p.id}
                href={`/u/${p.username}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 hover:bg-secondary/60 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-secondary flex-shrink-0 overflow-hidden flex items-center justify-center ring-1 ring-white/10">
                  {p.avatar_url
                    ? <img src={p.avatar_url} alt={p.username} className="w-full h-full object-cover" />
                    : <User size={13} className="text-muted-foreground" />
                  }
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{p.display_name ?? p.username}</p>
                  <p className="text-[11px] text-muted-foreground truncate">@{p.username}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}

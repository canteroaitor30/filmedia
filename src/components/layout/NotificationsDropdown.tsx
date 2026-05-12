"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { fetchNotifications, type NotifItem } from "@/app/actions/notifications";

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
}

function notifText(type: NotifItem["type"], name: string, mediaType: string | null) {
  switch (type) {
    case "new_follower": return `${name} te ha seguido`;
    case "friend_reviewed_watchlist": return `${name} ha reseñado algo de tu historial`;
    case "friend_rated_same": return `${name} también ha visto esta ${mediaType === "movie" ? "película" : mediaType === "series" ? "serie" : "anime"}`;
    case "comment_on_review": return `${name} ha comentado tu reseña`;
    default: return `Nueva actividad de ${name}`;
  }
}

function notifHref(n: NotifItem) {
  if (n.type === "new_follower") return `/u/${n.actorUsername}`;
  if (n.media_type && n.external_id) {
    if (n.media_type === "movie") return `/movies/${n.external_id}`;
    if (n.media_type === "series") return `/series/${n.external_id}`;
    if (n.media_type === "anime") return `/anime/${n.external_id}`;
  }
  return `/u/${n.actorUsername}`;
}

export function NotificationsDropdown({ unreadCount }: { unreadCount?: number }) {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<NotifItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [badge, setBadge] = useState(unreadCount ?? 0);
  const ref = useRef<HTMLDivElement>(null);

  async function handleOpen() {
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (notifs !== null) return;
    setLoading(true);
    try {
      const data = await fetchNotifications();
      setNotifs(data);
      setBadge(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative flex items-center text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Notificaciones"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {badge > 0 && (
          <span className="absolute -top-1 -right-1 text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full" style={{ backgroundColor: "var(--gold)", color: "#0A0A0A" }}>
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-8 w-80 rounded-xl border border-border bg-background shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold">Notificaciones</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 rounded-full border-2 border-border border-t-foreground animate-spin" />
            </div>
          ) : !notifs?.length ? (
            <div className="text-center py-10 text-muted-foreground">
              <p className="text-2xl mb-2">🔔</p>
              <p className="text-sm">Sin notificaciones</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {notifs.map((n) => (
                <Link
                  key={n.id}
                  href={notifHref(n)}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/60 ${!n.read ? "bg-secondary/40" : ""}`}
                >
                  <div className="w-8 h-8 rounded-full bg-secondary flex-shrink-0 overflow-hidden flex items-center justify-center text-xs font-semibold">
                    {n.actorAvatar
                      ? <img src={n.actorAvatar} alt={n.actorUsername} className="w-full h-full object-cover" />
                      : n.actorUsername[0]?.toUpperCase()
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs leading-snug">{notifText(n.type, n.actorUsername, n.media_type)}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.read && (
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: "var(--gold)" }} />
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

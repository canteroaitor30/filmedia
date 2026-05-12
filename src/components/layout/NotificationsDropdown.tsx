"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { fetchNotifications, type NotifItem } from "@/app/actions/notifications";
import { Bell } from "lucide-react";

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
        className="relative flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors"
        aria-label="Notificaciones"
      >
        <Bell size={16} />
        {badge > 0 && (
          <span className="absolute -top-0.5 -right-0.5 text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full" style={{ backgroundColor: "var(--gold)", color: "#0A0A0A" }}>
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 rounded-xl border border-border/60 bg-background/95 backdrop-blur-md shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50">
            <p className="text-sm font-semibold">Notificaciones</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 rounded-full border-2 border-border border-t-foreground animate-spin" />
            </div>
          ) : !notifs?.length ? (
            <div className="text-center py-10 text-muted-foreground">
              <Bell size={24} className="mx-auto mb-2.5 opacity-30" />
              <p className="text-sm">Sin notificaciones</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {notifs.map((n) => (
                <Link
                  key={n.id}
                  href={notifHref(n)}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/50 ${!n.read ? "bg-secondary/30" : ""}`}
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

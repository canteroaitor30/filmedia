import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";

type NotifRow = {
  id: string;
  type: "new_follower" | "friend_reviewed_watchlist" | "friend_rated_same" | "comment_on_review";
  actor_id: string;
  media_type: string | null;
  external_id: number | null;
  read: boolean;
  created_at: string;
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  const d = Math.floor(h / 24);
  return `hace ${d}d`;
}

function notifText(type: NotifRow["type"], actorName: string, mediaType: string | null) {
  switch (type) {
    case "new_follower": return `${actorName} te ha seguido`;
    case "friend_rated_same": return `${actorName} también ha visto este ${mediaType === "movie" ? "película" : mediaType === "series" ? "serie" : "anime"}`;
    case "friend_reviewed_watchlist": return `${actorName} ha reseñado algo de tu watchlist`;
    case "comment_on_review": return `${actorName} ha comentado tu reseña`;
    default: return `Nueva actividad de ${actorName}`;
  }
}

function notifHref(notif: NotifRow, actorUsername: string) {
  if (notif.type === "new_follower") return `/u/${actorUsername}`;
  if (notif.media_type && notif.external_id) {
    if (notif.media_type === "movie") return `/movies/${notif.external_id}`;
    if (notif.media_type === "series") return `/series/${notif.external_id}`;
    if (notif.media_type === "anime") return `/anime/${notif.external_id}`;
  }
  return `/u/${actorUsername}`;
}

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: notifs } = await supabase
    .from("notifications")
    .select("id, type, actor_id, media_type, external_id, read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const actorIds = [...new Set((notifs ?? []).map((n) => n.actor_id))];
  const admin = createAdminClient();
  const { data: actors } = actorIds.length
    ? await admin.from("profiles").select("id, username, avatar_url").in("id", actorIds)
    : { data: [] };

  const actorMap = Object.fromEntries((actors ?? []).map((a) => [a.id, a]));

  // Mark all as read
  const unreadIds = (notifs ?? []).filter((n) => !n.read).map((n) => n.id);
  if (unreadIds.length) {
    await supabase.from("notifications").update({ read: true }).in("id", unreadIds);
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-6">Notificaciones</h1>

      {!notifs?.length ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-4xl mb-3">🔔</p>
          <p>No tienes notificaciones aún.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {(notifs as NotifRow[]).map((notif) => {
            const actor = actorMap[notif.actor_id];
            const actorName = actor?.username ?? "Alguien";
            const href = notifHref(notif, actorName);
            return (
              <Link
                key={notif.id}
                href={href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-secondary/60 ${notif.read ? "" : "bg-secondary"}`}
              >
                <div className="w-9 h-9 rounded-full bg-secondary flex-shrink-0 overflow-hidden flex items-center justify-center text-sm font-semibold">
                  {actor?.avatar_url
                    ? <img src={actor.avatar_url} alt={actorName} className="w-full h-full object-cover" />
                    : actorName[0]?.toUpperCase()
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{notifText(notif.type, actorName, notif.media_type)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(notif.created_at)}</p>
                </div>
                {!notif.read && (
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: "var(--gold)" }} />
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

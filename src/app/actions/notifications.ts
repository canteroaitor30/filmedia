"use server";

import { createClient } from "@/lib/supabase/server";

export type NotifItem = {
  id: string;
  type: "new_follower" | "friend_reviewed_watchlist" | "friend_rated_same" | "comment_on_review";
  actor_id: string;
  media_type: string | null;
  external_id: number | null;
  read: boolean;
  created_at: string;
  actorUsername: string;
  actorAvatar: string | null;
};

export async function fetchNotifications(): Promise<NotifItem[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: notifs } = await supabase
    .from("notifications")
    .select("id, type, actor_id, media_type, external_id, read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30);

  if (!notifs?.length) return [];

  const actorIds = [...new Set(notifs.map((n) => n.actor_id))];
  const { data: actors } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", actorIds);

  const actorMap = Object.fromEntries((actors ?? []).map((a) => [a.id, a]));

  const unreadIds = notifs.filter((n) => !n.read).map((n) => n.id);
  if (unreadIds.length) {
    await supabase.from("notifications").update({ read: true }).in("id", unreadIds);
  }

  return notifs.map((n) => ({
    ...n,
    type: n.type as NotifItem["type"],
    actorUsername: actorMap[n.actor_id]?.username ?? "Alguien",
    actorAvatar: actorMap[n.actor_id]?.avatar_url ?? null,
  }));
}

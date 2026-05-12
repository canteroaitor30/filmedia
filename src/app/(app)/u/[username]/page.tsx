import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FollowButton } from "@/components/social/FollowButton";
import { WatchlistTab } from "@/components/profile/WatchlistTab";
import { StatsTab } from "@/components/profile/StatsTab";
import { EditProfileButton } from "@/components/profile/EditProfileButton";
import { LogoutButton } from "@/components/profile/LogoutButton";
import { Lock } from "lucide-react";

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string; type?: string; rating?: string; platform?: string; genre?: string; year?: string; sort?: string }>;
}) {
  const [{ username }, sp] = await Promise.all([params, searchParams]);
  const tab = sp.tab ?? "watchlist";
  const filters = { type: sp.type, rating: sp.rating, platform: sp.platform, genre: sp.genre, year: sp.year, sort: sp.sort };
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio, privacy_profile, privacy_watchlist")
    .eq("username", username.toLowerCase())
    .single();

  if (!profile) notFound();

  const isOwn = user?.id === profile.id;

  const [followersRes, followingRes, watchedRes, pendingRes, isFollowingRes] = await Promise.all([
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", profile.id),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", profile.id),
    supabase.from("user_media").select("*", { count: "exact", head: true }).eq("user_id", profile.id).eq("status", "watched"),
    supabase.from("user_media").select("*", { count: "exact", head: true }).eq("user_id", profile.id).eq("status", "pending"),
    user && !isOwn
      ? supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", user.id).eq("following_id", profile.id)
      : Promise.resolve({ count: 0 }),
  ]);

  const isFollowing = (isFollowingRes.count ?? 0) > 0;

  const canSeeProfile = isOwn
    || profile.privacy_profile === "public"
    || (profile.privacy_profile === "followers" && isFollowing);

  const canSeeWatchlist = canSeeProfile && (
    isOwn
    || profile.privacy_watchlist === "public"
    || (profile.privacy_watchlist === "followers" && isFollowing)
  );

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-5 mb-8 pb-8 border-b border-border/50">
        <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden ring-1 ring-white/10">
          {profile.avatar_url && canSeeProfile
            ? <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
            : <div className="w-full h-full rounded-2xl" style={{ backgroundColor: "var(--gold)" }} />
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-bold">{profile.display_name ?? profile.username}</h1>
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
            </div>
            <div className="flex items-center gap-2">
              {!isOwn && user && (
                <FollowButton targetId={profile.id} initialFollowing={isFollowing} />
              )}
              {isOwn && (
                <>
                  <EditProfileButton profile={{ display_name: profile.display_name, bio: profile.bio, avatar_url: profile.avatar_url }} />
                  <LogoutButton />
                </>
              )}
            </div>
          </div>
          {canSeeProfile && profile.bio && (
            <p className="text-sm text-muted-foreground mt-2 max-w-md">{profile.bio}</p>
          )}
          {canSeeProfile && (
            <div className="flex gap-5 mt-3 text-sm">
              <span><strong className="font-bold tabular-nums">{watchedRes.count ?? 0}</strong> <span className="text-muted-foreground">vistos</span></span>
              <span><strong className="font-bold tabular-nums">{pendingRes.count ?? 0}</strong> <span className="text-muted-foreground">pendientes</span></span>
              <span><strong className="font-bold tabular-nums">{followersRes.count ?? 0}</strong> <span className="text-muted-foreground">seguidores</span></span>
              <span><strong className="font-bold tabular-nums">{followingRes.count ?? 0}</strong> <span className="text-muted-foreground">siguiendo</span></span>
            </div>
          )}
        </div>
      </div>

      {!canSeeProfile ? (
        <div className="text-center py-20 text-muted-foreground">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ backgroundColor: "color-mix(in srgb, var(--gold) 10%, transparent)" }}>
            <Lock size={24} style={{ color: "var(--gold)" }} />
          </div>
          <p className="font-medium text-foreground">Este perfil es privado</p>
          <p className="text-sm mt-1">Sigue a este usuario para ver su actividad</p>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-0 border-b border-border mb-6">
            {(["watchlist", "historial", "stats"] as const).map((t) => (
              <Link
                key={t}
                href={`/u/${profile.username}?tab=${t}`}
                className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  tab === t
                    ? "border-[var(--gold)] text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "watchlist" && (
                  <>Watchlist{" "}<span className="ml-1 text-xs font-normal opacity-60">{pendingRes.count ?? 0}</span></>
                )}
                {t === "historial" && (
                  <>Historial{" "}<span className="ml-1 text-xs font-normal opacity-60">{watchedRes.count ?? 0}</span></>
                )}
                {t === "stats" && "Estadísticas"}
              </Link>
            ))}
          </div>

          {tab === "stats"
            ? <StatsTab userId={profile.id} />
            : canSeeWatchlist
              ? <WatchlistTab
                  userId={profile.id}
                  isOwn={isOwn}
                  forcedStatus={tab === "watchlist" ? "pending" : "watched"}
                  filters={filters}
                />
              : (
                <div className="text-center py-20 text-muted-foreground">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ backgroundColor: "color-mix(in srgb, var(--gold) 10%, transparent)" }}>
                    <Lock size={24} style={{ color: "var(--gold)" }} />
                  </div>
                  <p className="font-medium text-foreground">Historial privado</p>
                  <p className="text-sm mt-1">Este usuario no comparte su historial públicamente</p>
                </div>
              )
          }
        </>
      )}
    </div>
  );
}

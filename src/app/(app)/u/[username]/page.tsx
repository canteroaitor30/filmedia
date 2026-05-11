import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FollowButton } from "@/components/social/FollowButton";
import { WatchlistTab } from "@/components/profile/WatchlistTab";
import { StatsTab } from "@/components/profile/StatsTab";
import { EditProfileButton } from "@/components/profile/EditProfileButton";

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string; type?: string; status?: string; rating?: string; platform?: string; genre?: string; year?: string }>;
}) {
  const [{ username }, sp] = await Promise.all([params, searchParams]);
  const tab = sp.tab ?? "watchlist";
  const filters = { type: sp.type, status: sp.status, rating: sp.rating, platform: sp.platform, genre: sp.genre, year: sp.year };
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

  const canSeeWatchlist = isOwn
    || profile.privacy_watchlist === "public"
    || (profile.privacy_watchlist === "followers" && (isFollowingRes.count ?? 0) > 0);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-5 mb-8">
        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
          {profile.avatar_url
            ? <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
            : <span className="text-muted-foreground">👤</span>
          }
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-4 flex-wrap">
            <h1 className="text-xl font-bold">{profile.display_name ?? profile.username}</h1>
            <span className="text-muted-foreground text-sm">@{profile.username}</span>
            {!isOwn && user && (
              <FollowButton targetId={profile.id} initialFollowing={(isFollowingRes.count ?? 0) > 0} />
            )}
            {isOwn && (
              <EditProfileButton profile={{ display_name: profile.display_name, bio: profile.bio, avatar_url: profile.avatar_url }} />
            )}
          </div>
          {profile.bio && <p className="text-sm text-muted-foreground mt-1">{profile.bio}</p>}
          <div className="flex gap-5 mt-3 text-sm">
            <span><strong>{watchedRes.count ?? 0}</strong> <span className="text-muted-foreground">vistos</span></span>
            <span><strong>{pendingRes.count ?? 0}</strong> <span className="text-muted-foreground">pendientes</span></span>
            <span><strong>{followersRes.count ?? 0}</strong> <span className="text-muted-foreground">seguidores</span></span>
            <span><strong>{followingRes.count ?? 0}</strong> <span className="text-muted-foreground">siguiendo</span></span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-6">
        {["watchlist", "stats"].map((t) => (
          <Link
            key={t}
            href={`/u/${profile.username}?tab=${t}`}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "watchlist" ? "Watchlist" : "Estadísticas"}
          </Link>
        ))}
      </div>

      {tab === "stats"
        ? <StatsTab userId={profile.id} />
        : canSeeWatchlist
          ? <WatchlistTab userId={profile.id} isOwn={isOwn} filters={filters} />
          : (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-4xl mb-3">🔒</p>
              <p>Esta watchlist es privada</p>
            </div>
          )
      }
    </div>
  );
}

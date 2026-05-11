import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { FollowButton } from "@/components/social/FollowButton";
import { WatchlistTab } from "@/components/profile/WatchlistTab";
import { EditProfileButton } from "@/components/profile/EditProfileButton";

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
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

      {/* Watchlist */}
      {canSeeWatchlist
        ? <WatchlistTab userId={profile.id} isOwn={isOwn} />
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

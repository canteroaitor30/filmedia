"use server";

import { createClient } from "@/lib/supabase/server";

export type ReviewData = {
  id: string;
  user_id: string;
  content: string;
  has_spoilers: boolean;
  privacy: string;
  created_at: string;
  edited_at: string | null;
  username: string;
  avatar_url: string | null;
  display_name: string | null;
  likeCount: number;
  likedByMe: boolean;
  commentCount: number;
};

export async function getReviews(
  mediaType: string,
  externalId: number
): Promise<{ reviews: ReviewData[]; currentUserId: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: rawData, error: reviewsError } = await supabase
    .from("reviews")
    .select("id, user_id, content, has_spoilers, privacy, created_at, edited_at, profiles(username, avatar_url, display_name)")
    .eq("media_type", mediaType as any)
    .eq("external_id", externalId)
    .order("created_at", { ascending: false });

  if (reviewsError) console.error("[getReviews] error:", reviewsError.message, "uid:", user?.id);

  const raw = (rawData as any[] | null) ?? [];
  if (!raw.length) return { reviews: [], currentUserId: user?.id ?? null };

  const reviewIds = raw.map((r) => r.id);
  const [likesRes, commentCountRes] = await Promise.all([
    supabase.from("review_likes").select("review_id, user_id").in("review_id", reviewIds),
    supabase.from("review_comments").select("review_id").in("review_id", reviewIds),
  ]);

  const likes = likesRes.data ?? [];
  const commentRefs = commentCountRes.data ?? [];

  const reviews: ReviewData[] = raw.map((r) => {
    const p = r.profiles as { username: string; avatar_url: string | null; display_name: string | null } | null;
    return {
      id: r.id, user_id: r.user_id, content: r.content,
      has_spoilers: r.has_spoilers, privacy: r.privacy,
      created_at: r.created_at, edited_at: r.edited_at,
      username: p?.username ?? "Usuario", avatar_url: p?.avatar_url ?? null, display_name: p?.display_name ?? null,
      likeCount: likes.filter((l) => l.review_id === r.id).length,
      likedByMe: user ? likes.some((l) => l.review_id === r.id && l.user_id === user.id) : false,
      commentCount: commentRefs.filter((c) => c.review_id === r.id).length,
    };
  });

  return { reviews, currentUserId: user?.id ?? null };
}

export async function upsertReview(opts: {
  mediaType: string;
  externalId: number;
  content: string;
  hasSpoilers: boolean;
  privacy: string;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { error } = await supabase.from("reviews").upsert({
    user_id: user.id,
    media_type: opts.mediaType as any,
    external_id: opts.externalId,
    content: opts.content,
    has_spoilers: opts.hasSpoilers,
    privacy: opts.privacy as any,
    edited_at: new Date().toISOString(),
  }, { onConflict: "user_id,media_type,external_id" });

  if (error) { console.error("[upsertReview]", error.message); return { error: error.message }; }
  return {};
}

export type CommentData = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  username: string;
  avatar_url: string | null;
};

export async function getReviewComments(reviewId: string): Promise<CommentData[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("review_comments")
    .select("id, user_id, content, created_at, profiles(username, avatar_url)")
    .eq("review_id", reviewId)
    .order("created_at", { ascending: true });

  return ((data as any[] | null) ?? []).map((c) => ({
    id: c.id,
    user_id: c.user_id,
    content: c.content,
    created_at: c.created_at,
    username: c.profiles?.username ?? "Usuario",
    avatar_url: c.profiles?.avatar_url ?? null,
  }));
}

export async function deleteReview(reviewId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };
  const { error } = await supabase.from("reviews").delete().eq("id", reviewId).eq("user_id", user.id);
  if (error) return { error: error.message };
  return {};
}

export async function toggleReviewLike(reviewId: string): Promise<{ liked: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: existing } = await supabase
    .from("review_likes")
    .select("review_id")
    .eq("review_id", reviewId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("review_likes").delete()
      .eq("review_id", reviewId).eq("user_id", user.id);
    return { liked: false };
  } else {
    await supabase.from("review_likes").insert({ review_id: reviewId, user_id: user.id });
    return { liked: true };
  }
}

export async function addReviewComment(
  reviewId: string,
  content: string
): Promise<{ id: string; user_id: string; content: string; created_at: string; username: string; avatar_url: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !content.trim()) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("review_comments")
    .insert({ review_id: reviewId, user_id: user.id, content: content.trim() })
    .select("id, user_id, content, created_at")
    .maybeSingle();

  if (error || !data) throw new Error(error?.message ?? "Error al guardar comentario");

  const [reviewRes, profileRes] = await Promise.all([
    supabase.from("reviews").select("user_id").eq("id", reviewId).maybeSingle(),
    supabase.from("profiles").select("username, avatar_url").eq("id", user.id).maybeSingle(),
  ]);

  if (reviewRes.data && reviewRes.data.user_id !== user.id) {
    await supabase.from("notifications").insert({
      user_id: reviewRes.data.user_id,
      type: "comment_on_review",
      actor_id: user.id,
      review_id: reviewId,
    });
  }

  return {
    ...data,
    username: profileRes.data?.username ?? "Usuario",
    avatar_url: profileRes.data?.avatar_url ?? null,
  };
}

export async function deleteReviewComment(commentId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("review_comments").delete().eq("id", commentId);
  if (error) throw new Error(error.message);
}

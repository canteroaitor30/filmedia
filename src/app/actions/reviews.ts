"use server";

import { createClient } from "@/lib/supabase/server";

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

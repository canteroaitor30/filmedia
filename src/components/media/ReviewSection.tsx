"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getReviews, toggleReviewLike, addReviewComment, deleteReviewComment } from "@/app/actions/reviews";
import type { MediaType, PrivacyLevel } from "@/types/database";
import { Heart, MessageCircle, AlertTriangle, PenLine, Globe, Users, Lock, X } from "lucide-react";
import { GoldSelect } from "@/components/ui/GoldSelect";

interface ReviewComment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  username: string;
  avatar_url: string | null;
}

interface ReviewWithMeta {
  id: string;
  user_id: string;
  content: string;
  has_spoilers: boolean;
  privacy: PrivacyLevel;
  created_at: string;
  edited_at: string | null;
  username: string;
  avatar_url: string | null;
  display_name: string | null;
  likeCount: number;
  likedByMe: boolean;
  commentCount: number;
}

type CommentState = { loaded: boolean; items: ReviewComment[]; loading: boolean };


const PRIVACY_LABELS: Record<PrivacyLevel, string> = {
  private: "Solo yo",
  followers: "Seguidores",
  public: "Público",
};

const PRIVACY_ICONS: Record<PrivacyLevel, React.ReactNode> = {
  private: <Lock size={10} />,
  followers: <Users size={10} />,
  public: <Globe size={10} />,
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
}

interface Props {
  mediaType: MediaType;
  externalId: number;
}

export function ReviewSection({ mediaType, externalId }: Props) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<ReviewWithMeta[]>([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [editorContent, setEditorContent] = useState("");
  const [editorHasSpoilers, setEditorHasSpoilers] = useState(false);
  const [editorPrivacy, setEditorPrivacy] = useState<PrivacyLevel>("followers");
  const [saving, setSaving] = useState(false);

  const [spoilerRevealed, setSpoilerRevealed] = useState<Set<string>>(new Set());
  const [expandedComments, setExpandedComments] = useState<Record<string, CommentState>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({});

  const supabase = createClient();

  async function loadReviews() {
    try {
      const { reviews: enriched, currentUserId: uid } = await getReviews(mediaType, externalId);
      setCurrentUserId(uid);
      setReviews(enriched.map((r) => ({ ...r, privacy: r.privacy as PrivacyLevel })));
      const own = enriched.find((r) => r.user_id === uid);
      if (own) { setEditorContent(own.content); setEditorHasSpoilers(own.has_spoilers); setEditorPrivacy(own.privacy as PrivacyLevel); }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReviews();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaType, externalId]);

  const ownReview = reviews.find((r) => r.user_id === currentUserId) ?? null;

  async function saveReview() {
    setSaving(true);
    try {
      if (!editorContent.trim()) return;

      if (ownReview) {
        const { error } = await supabase.from("reviews").update({
          content: editorContent.trim(),
          has_spoilers: editorHasSpoilers,
          privacy: editorPrivacy,
          edited_at: new Date().toISOString(),
        }).eq("id", ownReview.id);
        if (error) return;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { error } = await supabase
          .from("reviews")
          .insert({ user_id: user.id, media_type: mediaType, external_id: externalId, content: editorContent.trim(), has_spoilers: editorHasSpoilers, privacy: editorPrivacy });
        if (error) { console.error("Review insert error:", error); return; }
      }
      await loadReviews();
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function removeReview() {
    if (!ownReview) return;
    const { error } = await supabase.from("reviews").delete().eq("id", ownReview.id);
    if (!error) {
      setReviews((prev) => prev.filter((r) => r.id !== ownReview.id));
      setEditorContent("");
      setEditorHasSpoilers(false);
      setEditorPrivacy("followers");
      setEditing(false);
    }
  }

  async function handleToggleLike(reviewId: string) {
    setReviews((prev) => prev.map((r) =>
      r.id === reviewId ? { ...r, likedByMe: !r.likedByMe, likeCount: r.likedByMe ? r.likeCount - 1 : r.likeCount + 1 } : r
    ));
    try {
      await toggleReviewLike(reviewId);
    } catch {
      setReviews((prev) => prev.map((r) =>
        r.id === reviewId ? { ...r, likedByMe: !r.likedByMe, likeCount: r.likedByMe ? r.likeCount - 1 : r.likeCount + 1 } : r
      ));
    }
  }

  async function handleExpandComments(reviewId: string) {
    if (expandedComments[reviewId]?.loaded) {
      setExpandedComments((prev) => { const n = { ...prev }; delete n[reviewId]; return n; });
      return;
    }
    setExpandedComments((prev) => ({ ...prev, [reviewId]: { loaded: false, items: [], loading: true } }));
    type RawComment = { id: string; user_id: string; content: string; created_at: string; profiles: { username: string; avatar_url: string | null } | null };
    const { data: commentData } = await supabase
      .from("review_comments")
      .select("id, user_id, content, created_at, profiles(username, avatar_url)")
      .eq("review_id", reviewId)
      .order("created_at", { ascending: true });

    const items: ReviewComment[] = ((commentData as unknown as RawComment[] | null) ?? []).map((c) => {
      const p = c.profiles;
      return { id: c.id, user_id: c.user_id, content: c.content, created_at: c.created_at, username: p?.username ?? "Usuario", avatar_url: p?.avatar_url ?? null };
    });
    setExpandedComments((prev) => ({ ...prev, [reviewId]: { loaded: true, items, loading: false } }));
  }

  async function handleAddComment(reviewId: string) {
    const content = (commentInputs[reviewId] ?? "").trim();
    if (!content) return;
    setSubmittingComment((prev) => ({ ...prev, [reviewId]: true }));
    try {
      const newComment = await addReviewComment(reviewId, content);
      setCommentInputs((prev) => ({ ...prev, [reviewId]: "" }));
      setExpandedComments((prev) => ({
        ...prev,
        [reviewId]: { loaded: true, loading: false, items: [...(prev[reviewId]?.items ?? []), newComment] },
      }));
      setReviews((prev) => prev.map((r) => r.id === reviewId ? { ...r, commentCount: r.commentCount + 1 } : r));
    } finally {
      setSubmittingComment((prev) => ({ ...prev, [reviewId]: false }));
    }
  }

  async function handleDeleteComment(reviewId: string, commentId: string) {
    await deleteReviewComment(commentId);
    setExpandedComments((prev) => ({
      ...prev,
      [reviewId]: { ...prev[reviewId], items: prev[reviewId].items.filter((c) => c.id !== commentId) },
    }));
    setReviews((prev) => prev.map((r) => r.id === reviewId ? { ...r, commentCount: r.commentCount - 1 } : r));
  }

  if (loading) return null;

  return (
    <div className="mt-10 border-t border-border/50 pt-8">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Reseñas{reviews.length > 0 && <span className="ml-2 font-normal normal-case opacity-60">{reviews.length}</span>}
        </h2>
        {currentUserId && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
          >
            <PenLine size={13} />
            {ownReview ? "Editar reseña" : "Escribir reseña"}
          </button>
        )}
      </div>

      {/* Editor */}
      {editing && (
        <div className="mb-6 p-4 rounded-xl border border-border/60 bg-secondary/20 space-y-3">
          <textarea
            value={editorContent}
            onChange={(e) => setEditorContent(e.target.value)}
            placeholder="Escribe tu reseña..."
            rows={4}
            className="w-full rounded-lg border border-border/60 bg-secondary/60 px-3.5 py-2.5 text-sm outline-none focus:border-[var(--gold)]/60 focus:ring-1 focus:ring-[var(--gold)]/30 resize-none transition-colors"
          />
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={editorHasSpoilers} onChange={(e) => setEditorHasSpoilers(e.target.checked)} className="accent-yellow-400 rounded" />
              <span className="text-muted-foreground text-xs">Contiene spoilers</span>
            </label>
            <GoldSelect
              label="Privacidad"
              value={editorPrivacy}
              onChange={(v) => setEditorPrivacy(v as PrivacyLevel)}
              options={(["private", "followers", "public"] as PrivacyLevel[]).map((p) => ({ value: p, label: PRIVACY_LABELS[p] }))}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={saveReview}
              disabled={saving || !editorContent.trim()}
              className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition-all hover:brightness-110 active:scale-[0.97]"
              style={{ backgroundColor: "var(--gold)", color: "#0A0A0A" }}
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
            <button
              onClick={() => { setEditing(false); if (ownReview) { setEditorContent(ownReview.content); setEditorHasSpoilers(ownReview.has_spoilers); setEditorPrivacy(ownReview.privacy); } }}
              className="px-4 py-2 rounded-lg text-sm border border-border/60 text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            {ownReview && (
              <button
                onClick={removeReview}
                className="ml-auto px-4 py-2 rounded-lg text-sm border border-border/60 text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
              >
                Eliminar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Reviews list */}
      {!reviews.length && !editing ? (
        <div className="py-10 text-center text-muted-foreground">
          <PenLine size={24} className="mx-auto mb-2.5 opacity-30" />
          <p className="text-sm">{currentUserId ? "Sé el primero en escribir una reseña" : "No hay reseñas aún"}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const isOwn = review.user_id === currentUserId;
            const revealed = spoilerRevealed.has(review.id);
            const commentsState = expandedComments[review.id];
            const commentInput = commentInputs[review.id] ?? "";

            return (
              <div key={review.id} className="border border-border/60 rounded-xl p-4 bg-card/30">
                {/* Header */}
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-7 h-7 rounded-full bg-secondary flex-shrink-0 overflow-hidden flex items-center justify-center text-xs font-semibold">
                    {review.avatar_url
                      ? <img src={review.avatar_url} alt={review.username} className="w-full h-full object-cover" />
                      : review.username[0]?.toUpperCase()
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold">{review.display_name ?? review.username}</span>
                    <span className="text-xs text-muted-foreground ml-1.5">@{review.username}</span>
                  </div>
                  <span className="text-xs text-muted-foreground/60 flex-shrink-0">{timeAgo(review.created_at)}</span>
                  {isOwn && !editing && (
                    <button
                      onClick={() => setEditing(true)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg border border-border/60 flex-shrink-0"
                    >
                      Editar
                    </button>
                  )}
                </div>

                {/* Content */}
                {review.has_spoilers && !revealed ? (
                  <div
                    className="rounded-lg border border-border/60 bg-secondary/30 p-3.5 cursor-pointer text-center mb-3 hover:bg-secondary/50 transition-colors"
                    onClick={() => setSpoilerRevealed((prev) => new Set([...prev, review.id]))}
                  >
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <AlertTriangle size={14} style={{ color: "var(--gold)" }} />
                      <p className="text-sm">Contiene spoilers · Pulsa para revelar</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap mb-3">{review.content}</p>
                )}

                {/* Footer */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground pt-2 border-t border-border/30">
                  <span className="inline-flex items-center gap-1 opacity-70">
                    {PRIVACY_ICONS[review.privacy]}
                    {PRIVACY_LABELS[review.privacy]}
                  </span>
                  {review.edited_at && <span className="opacity-50">· Editado</span>}
                  <div className="ml-auto flex items-center gap-3">
                    {currentUserId && !isOwn && (
                      <button
                        onClick={() => handleToggleLike(review.id)}
                        className={`flex items-center gap-1 transition-colors ${review.likedByMe ? "text-rose-500" : "hover:text-rose-400"}`}
                      >
                        <Heart size={13} fill={review.likedByMe ? "currentColor" : "none"} />
                        {review.likeCount > 0 && <span>{review.likeCount}</span>}
                      </button>
                    )}
                    {!currentUserId && review.likeCount > 0 && (
                      <span className="flex items-center gap-1">
                        <Heart size={13} fill="currentColor" className="text-rose-400" />
                        <span>{review.likeCount}</span>
                      </span>
                    )}
                    <button
                      onClick={() => handleExpandComments(review.id)}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      <MessageCircle size={13} />
                      <span>{review.commentCount > 0 ? review.commentCount : (commentsState ? "Cerrar" : "Comentar")}</span>
                    </button>
                  </div>
                </div>

                {/* Comments */}
                {commentsState && (
                  <div className="mt-3 pt-3 border-t border-border/30 space-y-2.5">
                    {commentsState.loading ? (
                      <p className="text-xs text-muted-foreground">Cargando...</p>
                    ) : (
                      <>
                        {commentsState.items.length === 0 && (
                          <p className="text-xs text-muted-foreground">Sin comentarios aún.</p>
                        )}
                        {commentsState.items.map((comment) => (
                          <div key={comment.id} className="flex items-start gap-2">
                            <div className="w-5 h-5 rounded-full bg-secondary flex-shrink-0 overflow-hidden flex items-center justify-center text-[10px] font-semibold mt-0.5">
                              {comment.avatar_url
                                ? <img src={comment.avatar_url} alt={comment.username} className="w-full h-full object-cover" />
                                : comment.username[0]?.toUpperCase()
                              }
                            </div>
                            <div className="flex-1 min-w-0 bg-secondary/30 rounded-lg px-2.5 py-1.5">
                              <span className="text-xs font-semibold">@{comment.username}</span>
                              <span className="text-xs text-muted-foreground/60 ml-1.5">{timeAgo(comment.created_at)}</span>
                              <p className="text-xs text-muted-foreground mt-0.5 break-words">{comment.content}</p>
                            </div>
                            {comment.user_id === currentUserId && (
                              <button
                                onClick={() => handleDeleteComment(review.id, comment.id)}
                                className="text-muted-foreground/50 hover:text-destructive transition-colors flex-shrink-0 mt-1"
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        ))}
                        {currentUserId && (
                          <div className="flex gap-2 mt-2">
                            <input
                              value={commentInput}
                              onChange={(e) => setCommentInputs((prev) => ({ ...prev, [review.id]: e.target.value }))}
                              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddComment(review.id); } }}
                              placeholder="Añadir comentario..."
                              className="flex-1 rounded-lg border border-border/60 bg-secondary/60 px-2.5 py-1.5 text-xs outline-none focus:border-[var(--gold)]/60 focus:ring-1 focus:ring-[var(--gold)]/30 transition-colors"
                            />
                            <button
                              onClick={() => handleAddComment(review.id)}
                              disabled={!commentInput.trim() || !!submittingComment[review.id]}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50 flex-shrink-0 transition-all hover:brightness-110 active:scale-95"
                              style={{ backgroundColor: "var(--gold)", color: "#0A0A0A" }}
                            >
                              {submittingComment[review.id] ? "..." : "Enviar"}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

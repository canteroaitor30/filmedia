"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Props {
  targetId: string;
  initialFollowing: boolean;
}

export function FollowButton({ targetId, initialFollowing }: Props) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  async function toggle() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (following) {
        const { error } = await supabase.from("follows").delete()
          .eq("follower_id", user.id).eq("following_id", targetId);
        if (!error) setFollowing(false);
      } else {
        const { error } = await supabase.from("follows").insert({ follower_id: user.id, following_id: targetId });
        if (!error) setFollowing(true);
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="px-4 py-1.5 rounded-full text-sm font-medium border transition-colors disabled:opacity-50"
      style={following
        ? { borderColor: "var(--border)", color: "var(--muted-foreground)" }
        : { backgroundColor: "var(--gold)", color: "#0A0A0A", borderColor: "var(--gold)" }
      }
    >
      {following ? "Siguiendo" : "Seguir"}
    </button>
  );
}

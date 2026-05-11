"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function generateInviteCode() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.id !== process.env.ADMIN_USER_ID) {
    redirect("/home");
  }

  const code = generateCode();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 14);

  await supabase.from("invitation_codes").insert({
    code,
    created_by: user.id,
    expires_at: expiresAt.toISOString(),
  });

  redirect("/admin/invites");
}

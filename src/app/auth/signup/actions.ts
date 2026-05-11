"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function markInviteCodeUsed(codeId: string, userId: string) {
  const admin = createAdminClient();
  await admin
    .from("invitation_codes")
    .update({ used_by: userId, used_at: new Date().toISOString() })
    .eq("id", codeId);
}

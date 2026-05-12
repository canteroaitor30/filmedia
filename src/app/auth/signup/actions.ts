"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function validateInviteCode(code: string): Promise<{ id: string | null; error?: string }> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("invitation_codes")
    .select("id")
    .eq("code", code.trim().toUpperCase())
    .is("used_by", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (!data) return { id: null, error: "Código inválido o ya utilizado" };
  return { id: data.id };
}

export async function signUpWithCode(
  email: string,
  password: string,
  username: string,
  codeId: string
): Promise<{ error?: string }> {
  const admin = createAdminClient();

  const { data: code } = await admin
    .from("invitation_codes")
    .select("id")
    .eq("id", codeId)
    .is("used_by", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (!code) return { error: "Código inválido o ya utilizado" };

  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("username", username.trim().toLowerCase())
    .maybeSingle();

  if (existing) return { error: "Ese nombre de usuario ya está en uso" };

  const supabase = await createClient();
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username: username.trim().toLowerCase() } },
  });

  if (signUpError || !authData.user) {
    return { error: signUpError?.message ?? "Error al crear la cuenta" };
  }

  await admin
    .from("invitation_codes")
    .update({ used_by: authData.user.id, used_at: new Date().toISOString() })
    .eq("id", codeId)
    .is("used_by", null);

  return {};
}

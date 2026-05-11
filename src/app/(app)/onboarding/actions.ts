"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const displayName = (formData.get("display_name") as string)?.trim() || null;
  const bio = (formData.get("bio") as string)?.trim() || null;
  const avatarUrl = (formData.get("avatar_url") as string)?.trim() || null;

  await supabase.from("profiles").update({
    display_name: displayName,
    bio,
    avatar_url: avatarUrl,
    onboarding_completed: true,
  }).eq("id", user.id);

  redirect("/home");
}

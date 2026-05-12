"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const [confirming, setConfirming] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">¿Seguro?</span>
        <button
          onClick={handleLogout}
          className="text-sm font-semibold text-destructive hover:underline transition-colors"
        >
          Sí
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:border-border transition-colors"
    >
      <LogOut size={13} />
      Cerrar sesión
    </button>
  );
}

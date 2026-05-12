"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Film, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Email o contraseña incorrectos");
      setLoading(false);
      return;
    }

    router.push("/home");
    router.refresh();
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ backgroundImage: "url('/fondo6.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative z-10 w-full max-w-sm">
        <div className="bg-background/85 backdrop-blur-md rounded-2xl p-8 border border-border/40 shadow-2xl">
          {/* Logo */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ backgroundColor: "color-mix(in srgb, var(--gold) 15%, transparent)" }}>
              <Film size={28} style={{ color: "var(--gold)" }} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--gold)" }}>
              Filmedia
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">Tu diario de cine y series</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-border/60 bg-secondary/60 px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-[var(--gold)]/60 focus:ring-1 focus:ring-[var(--gold)]/40"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-border/60 bg-secondary/60 px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-[var(--gold)]/60 focus:ring-1 focus:ring-[var(--gold)]/40"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5">
                <AlertCircle size={14} className="text-destructive flex-shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg py-2.5 text-sm font-semibold transition-all disabled:opacity-50 hover:brightness-110 active:scale-[0.98] mt-2"
              style={{ backgroundColor: "var(--gold)", color: "#0A0A0A" }}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-border/30 text-center">
            <p className="text-sm text-muted-foreground">
              ¿Tienes un código de invitación?{" "}
              <Link href="/auth/signup" className="font-semibold transition-opacity hover:opacity-80" style={{ color: "var(--gold)" }}>
                Regístrate
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

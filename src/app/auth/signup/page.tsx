"use client";

import { useState } from "react";
import Link from "next/link";
import { validateInviteCode, signUpWithCode } from "./actions";

export default function SignupPage() {
  const [step, setStep] = useState<"code" | "account">("code");
  const [inviteCode, setInviteCode] = useState("");
  const [codeId, setCodeId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function validateCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await validateInviteCode(inviteCode);
      if (!result.id) {
        setError(result.error ?? "Código inválido o ya utilizado");
        return;
      }
      setCodeId(result.id);
      setStep("account");
    } finally {
      setLoading(false);
    }
  }

  async function createAccount(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await signUpWithCode(email, password, username, codeId!);
      if (result.error) {
        setError(result.error);
        return;
      }
      window.location.href = "/onboarding";
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--gold)" }}>
            Filmedia
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {step === "code" ? "Introduce tu código de invitación" : "Crea tu cuenta"}
          </p>
        </div>

        {step === "code" ? (
          <form onSubmit={validateCode} className="space-y-4">
            <div>
              <label htmlFor="code" className="block text-sm font-medium mb-1">
                Código de invitación
              </label>
              <input
                id="code"
                type="text"
                required
                placeholder="XXXXXXXX"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring uppercase tracking-widest"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md py-2 text-sm font-semibold transition-colors disabled:opacity-50"
              style={{ backgroundColor: "var(--gold)", color: "#0A0A0A" }}
            >
              {loading ? "Verificando..." : "Continuar"}
            </button>
          </form>
        ) : (
          <form onSubmit={createAccount} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-1">
                Nombre de usuario
              </label>
              <input
                id="username"
                type="text"
                required
                placeholder="aitor"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md py-2 text-sm font-semibold transition-colors disabled:opacity-50"
              style={{ backgroundColor: "var(--gold)", color: "#0A0A0A" }}
            >
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <Link href="/auth/login" className="font-medium hover:underline" style={{ color: "var(--gold)" }}>
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}

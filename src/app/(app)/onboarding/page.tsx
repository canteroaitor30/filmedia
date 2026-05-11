"use client";

import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--gold)" }}>
          Bienvenido a Filmedia
        </h1>
        <p className="text-muted-foreground mb-8">
          Tu cuenta está lista. El onboarding completo llegará pronto.
        </p>
        <button
          onClick={() => router.push("/home")}
          className="rounded-md px-6 py-2 text-sm font-semibold"
          style={{ backgroundColor: "var(--gold)", color: "#0A0A0A" }}
        >
          Entrar
        </button>
      </div>
    </div>
  );
}

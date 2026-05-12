"use client";

import { useState } from "react";
import { sendInvite } from "@/app/actions/invite";
import { Send } from "lucide-react";

export function InviteForm({ availableCodes }: { availableCodes: number }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");
    const result = await sendInvite(email.trim());
    if (result.error) {
      setErrorMsg(result.error);
      setStatus("error");
    } else {
      setStatus("ok");
      setEmail("");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  return (
    <div className="border border-border/60 rounded-xl p-4 mb-6" style={{ background: "color-mix(in srgb, var(--gold) 4%, transparent)" }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--gold)" }}>Invitar usuario</p>
        <span className="text-xs text-muted-foreground">{availableCodes} código{availableCodes !== 1 ? "s" : ""} disponible{availableCodes !== 1 ? "s" : ""}</span>
      </div>
      <form onSubmit={submit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="correo@amigo.com"
          required
          className="flex-1 rounded-lg border border-border/60 bg-secondary/60 px-3 py-2 text-sm outline-none focus:border-[var(--gold)]/60 transition-colors placeholder:text-muted-foreground/40"
        />
        <button
          type="submit"
          disabled={status === "sending" || availableCodes === 0}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition-all hover:brightness-110"
          style={{ backgroundColor: "var(--gold)", color: "#0A0A0A" }}
        >
          <Send size={13} />
          {status === "sending" ? "Enviando..." : "Enviar"}
        </button>
      </form>
      {status === "ok" && (
        <p className="text-xs mt-2" style={{ color: "var(--gold)" }}>✓ Invitación enviada</p>
      )}
      {status === "error" && (
        <p className="text-xs mt-2 text-destructive">{errorMsg}</p>
      )}
    </div>
  );
}

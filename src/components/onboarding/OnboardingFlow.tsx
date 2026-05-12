"use client";

import { useState, useTransition } from "react";
import { saveOnboardingRatings } from "@/app/actions/watch";
import { useRouter } from "next/navigation";

const PRESET_AVATARS = [
  "/avatars/avatar3.webp", "/avatars/avatar4.jpg", "/avatars/avatar5.jpg",
  "/avatars/avatar6.jpg", "/avatars/avatar7.webp", "/avatars/avatar8.webp",
  "/avatars/avatar9.jpg", "/avatars/avatar10.jpg", "/avatars/avatar11.webp",
  "/avatars/avatar12.jpg", "/avatars/avatar13.webp", "/avatars/avatar15.jpg",
];

export interface OnboardingItem {
  mediaType: "movie" | "series" | "anime";
  externalId: number;
  title: string;
  poster: string | null;
  year: number | null;
}

interface Props {
  username: string;
  items: OnboardingItem[];
}

function Stars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;

  function half(e: React.MouseEvent<HTMLButtonElement>, star: number) {
    const rect = e.currentTarget.getBoundingClientRect();
    return (e.clientX - rect.left) < rect.width / 2 ? star - 0.5 : star;
  }

  return (
    <div className="flex justify-center" style={{ gap: "1px" }}>
      {[1, 2, 3, 4, 5].map((star) => {
        const fill = Math.min(Math.max(active - (star - 1), 0), 1);
        return (
          <button
            key={star}
            type="button"
            onMouseMove={(e) => setHovered(half(e, star))}
            onMouseLeave={() => setHovered(0)}
            onClick={(e) => { const v = half(e, star); onChange(value === v ? 0 : v); }}
            className="relative transition-transform hover:scale-110"
            style={{ width: 18, height: 18, flexShrink: 0 }}
          >
            <span className="absolute inset-0 flex items-center justify-center" style={{ color: "var(--border)" }}>★</span>
            {fill > 0 && (
              <span className="absolute inset-0 overflow-hidden flex items-center justify-center" style={{ width: fill >= 1 ? "100%" : "50%", color: "var(--gold)" }}>★</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function OnboardingFlow({ username, items }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [isPending, startTransition] = useTransition();

  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);

  const ratingKey = (item: OnboardingItem) => `${item.mediaType}-${item.externalId}`;
  const ratedCount = Object.values(ratings).filter((v) => v > 0).length;

  function finish(avatarUrl?: string) {
    startTransition(async () => {
      const ratedItems = items
        .filter((item) => (ratings[ratingKey(item)] ?? 0) > 0)
        .map((item) => ({
          mediaType: item.mediaType,
          externalId: item.externalId,
          title: item.title,
          rating: ratings[ratingKey(item)],
        }));

      await saveOnboardingRatings(
        { displayName, bio, avatarUrl: avatarUrl ?? "" },
        ratedItems,
      );
      router.push("/home");
    });
  }

  function goToAvatarPicker() {
    setStep(3);
  }

  // ─── Step 1: Profile ──────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--gold)" }}>
              Bienvenido a Filmedia
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Hola <strong>@{username}</strong>. Cuéntanos un poco sobre ti.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label htmlFor="display_name" className="block text-sm font-medium mb-1">
                Nombre visible <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <input
                id="display_name"
                type="text"
                maxLength={50}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
              />
              <p className="text-xs text-muted-foreground mt-1">Si lo dejas vacío se usará tu @usuario</p>
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium mb-1">
                Bio <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <textarea
                id="bio"
                rows={3}
                maxLength={160}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring resize-none"
              />
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full rounded-md py-2.5 text-sm font-semibold transition-colors"
              style={{ backgroundColor: "var(--gold)", color: "#0A0A0A" }}
            >
              Siguiente →
            </button>
          </div>

          <p className="text-xs text-center text-muted-foreground mt-4">Paso 1 de 3</p>
        </div>
      </div>
    );
  }

  // ─── Step 2: Rate titles ──────────────────────────────────────
  if (step === 2) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="mb-4 text-center">
          <h2 className="text-xl font-bold">¿Qué has visto?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Puntúa lo que hayas visto. Sáltate los que no conozcas.
          </p>
        </div>

        <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mb-4">
          {items.map((item) => {
            const key = ratingKey(item);
            const rating = ratings[key] ?? 0;
            return (
              <div key={key} className="flex flex-col gap-0.5">
                <div className="aspect-[2/3] rounded-md overflow-hidden bg-secondary relative">
                  {item.poster ? (
                    <img src={item.poster} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs text-center p-1">
                      {item.title}
                    </div>
                  )}
                  <div className="absolute top-1 right-1">
                    <span className="text-[9px] px-1 py-0.5 rounded font-medium bg-black/60 text-white">
                      {item.mediaType === "movie" ? "Peli" : item.mediaType === "series" ? "Serie" : "Anime"}
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-center truncate text-muted-foreground leading-tight">{item.title}</p>
                <Stars value={rating} onChange={(v) => setRatings((prev) => ({ ...prev, [key]: v }))} />
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-4">
          {ratedCount > 0 && (
            <p className="text-sm text-muted-foreground">
              <strong>{ratedCount}</strong> puntuado{ratedCount !== 1 ? "s" : ""}
            </p>
          )}
          <button
            type="button"
            onClick={goToAvatarPicker}
            disabled={isPending}
            className="rounded-md px-6 py-2 text-sm font-semibold transition-colors disabled:opacity-60"
            style={{ backgroundColor: "var(--gold)", color: "#0A0A0A" }}
          >
            {isPending ? "Guardando..." : "Siguiente →"}
          </button>
          <button
            type="button"
            onClick={() => setStep(1)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Volver
          </button>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-2">Paso 2 de 3</p>
      </div>
    );
  }

  // ─── Step 3: Pick avatar photo ────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold">Elige tu foto de perfil</h2>
        <p className="mt-2 text-sm text-muted-foreground">Puedes cambiarlo más adelante desde tu perfil.</p>
      </div>

      <div className="grid grid-cols-6 gap-3 mb-8">
        {PRESET_AVATARS.map((src) => {
          const selected = selectedAvatar === src;
          return (
            <button
              key={src}
              type="button"
              onClick={() => setSelectedAvatar(selected ? null : src)}
              className="aspect-square rounded-full overflow-hidden transition-all"
              style={selected ? { outline: "3px solid var(--gold)", outlineOffset: "3px" } : {}}
            >
              <img src={src} alt="Avatar" className="w-full h-full object-cover" />
            </button>
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => finish(selectedAvatar ?? undefined)}
          disabled={isPending}
          className="w-full max-w-xs rounded-md py-2.5 text-sm font-semibold transition-colors disabled:opacity-60"
          style={{ backgroundColor: "var(--gold)", color: "#0A0A0A" }}
        >
          {isPending ? "Guardando..." : selectedAvatar ? "Usar esta foto →" : "Omitir y empezar"}
        </button>
        <button
          type="button"
          onClick={() => setStep(2)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Volver
        </button>
      </div>

      <p className="text-xs text-center text-muted-foreground mt-4">Paso 3 de 3</p>
    </div>
  );
}

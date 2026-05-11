"use client";

import { useState, useTransition } from "react";
import { saveOnboardingRatings } from "@/app/actions/watch";
import { useRouter } from "next/navigation";

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
  return (
    <div className="flex gap-0.5 justify-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(value === star ? 0 : star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="text-lg leading-none transition-transform hover:scale-110"
          style={{ color: star <= (hovered || value) ? "var(--gold)" : "var(--border)" }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export function OnboardingFlow({ username, items }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [isPending, startTransition] = useTransition();

  const ratingKey = (item: OnboardingItem) => `${item.mediaType}-${item.externalId}`;

  const ratedCount = Object.values(ratings).filter((v) => v > 0).length;

  function handleFinish() {
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
        { displayName, bio, avatarUrl },
        ratedItems,
      );
      router.push("/home");
    });
  }

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

            <div>
              <label htmlFor="avatar_url" className="block text-sm font-medium mb-1">
                URL de avatar <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <input
                id="avatar_url"
                type="url"
                placeholder="https://..."
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
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

          <p className="text-xs text-center text-muted-foreground mt-4">Paso 1 de 2</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold">¿Qué has visto últimamente?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Puntúa lo que ya hayas visto para que podamos recomendarte mejor. Puedes saltarte los que no conozcas.
        </p>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-8">
        {items.map((item) => {
          const key = ratingKey(item);
          const rating = ratings[key] ?? 0;
          return (
            <div key={key} className="flex flex-col gap-1">
              <div className="aspect-[2/3] rounded-lg overflow-hidden bg-secondary relative">
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

      <div className="flex flex-col items-center gap-3">
        {ratedCount > 0 && (
          <p className="text-sm text-muted-foreground">
            Has puntuado <strong>{ratedCount}</strong> {ratedCount === 1 ? "título" : "títulos"}
          </p>
        )}
        <button
          type="button"
          onClick={handleFinish}
          disabled={isPending}
          className="w-full max-w-xs rounded-md py-2.5 text-sm font-semibold transition-colors disabled:opacity-60"
          style={{ backgroundColor: "var(--gold)", color: "#0A0A0A" }}
        >
          {isPending ? "Guardando..." : ratedCount > 0 ? "Empezar a explorar" : "Omitir y empezar"}
        </button>
        <button
          type="button"
          onClick={() => setStep(1)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Volver al perfil
        </button>
      </div>

      <p className="text-xs text-center text-muted-foreground mt-4">Paso 2 de 2</p>
    </div>
  );
}

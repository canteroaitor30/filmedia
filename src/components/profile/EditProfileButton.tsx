"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Settings } from "lucide-react";
import { GoldSelect } from "@/components/ui/GoldSelect";

const PRESET_AVATARS = [
  "/avatars/avatar3.webp", "/avatars/avatar4.jpg", "/avatars/avatar5.jpg",
  "/avatars/avatar6.jpg", "/avatars/avatar7.webp", "/avatars/avatar8.webp",
  "/avatars/avatar9.jpg", "/avatars/avatar10.jpg", "/avatars/avatar11.webp",
  "/avatars/avatar12.jpg", "/avatars/avatar13.webp", "/avatars/avatar15.jpg",
];

type Privacy = "public" | "followers" | "private";

interface Props {
  profile: {
    display_name: string | null;
    bio: string | null;
    avatar_url: string | null;
    privacy_profile: Privacy;
    privacy_watchlist: Privacy;
  };
}

export function EditProfileButton({ profile }: Props) {
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [privacyProfile, setPrivacyProfile] = useState<Privacy>(profile.privacy_profile);
  const [privacyWatchlist, setPrivacyWatchlist] = useState<Privacy>(profile.privacy_watchlist);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("profiles").update({
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        avatar_url: avatarUrl || null,
        privacy_profile: privacyProfile,
        privacy_watchlist: privacyWatchlist,
      }).eq("id", user.id);
      setOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }


  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
      >
        <Settings size={13} />
        Editar perfil
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setOpen(false)}>
          <div className="bg-card border border-border/60 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-base mb-5">Editar perfil</h3>
            <form onSubmit={save} className="space-y-5">

              {/* Avatar picker */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2.5">Foto de perfil</label>
                <div className="grid grid-cols-6 gap-2">
                  {PRESET_AVATARS.map((src) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => setAvatarUrl(src)}
                      className="aspect-square rounded-full overflow-hidden transition-all hover:scale-110 active:scale-95"
                      style={avatarUrl === src ? { outline: "2px solid var(--gold)", outlineOffset: "3px" } : {}}
                    >
                      <img src={src} alt="Avatar" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Nombre visible</label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={50}
                  placeholder="Tu nombre"
                  className="w-full rounded-lg border border-border/60 bg-secondary/60 px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-[var(--gold)]/60 focus:ring-1 focus:ring-[var(--gold)]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={160}
                  rows={3}
                  className="w-full rounded-lg border border-border/60 bg-secondary/60 px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-[var(--gold)]/60 focus:ring-1 focus:ring-[var(--gold)]/30 resize-none"
                />
                <p className="text-xs text-muted-foreground/60 mt-1">{bio.length}/160</p>
              </div>

              {/* Privacy */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2.5">Privacidad</label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-muted-foreground">Perfil</span>
                    <GoldSelect
                      label="Perfil"
                      value={privacyProfile}
                      onChange={(v) => setPrivacyProfile(v as Privacy)}
                      options={[{ value: "public", label: "Público" }, { value: "followers", label: "Solo seguidores" }, { value: "private", label: "Privado" }]}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-muted-foreground">Watchlist</span>
                    <GoldSelect
                      label="Watchlist"
                      value={privacyWatchlist}
                      onChange={(v) => setPrivacyWatchlist(v as Privacy)}
                      options={[{ value: "public", label: "Público" }, { value: "followers", label: "Solo seguidores" }, { value: "private", label: "Privado" }]}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 transition-all hover:brightness-110 active:scale-[0.98]"
                  style={{ backgroundColor: "var(--gold)", color: "#0A0A0A" }}
                >
                  {saving ? "Guardando..." : "Guardar"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2.5 rounded-lg text-sm border border-border/60 text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

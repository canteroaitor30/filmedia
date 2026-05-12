"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const PRESET_AVATARS = [
  "/avatars/avatar3.webp", "/avatars/avatar4.jpg", "/avatars/avatar5.jpg",
  "/avatars/avatar6.jpg", "/avatars/avatar7.webp", "/avatars/avatar8.webp",
  "/avatars/avatar9.jpg", "/avatars/avatar10.jpg", "/avatars/avatar11.webp",
  "/avatars/avatar12.jpg", "/avatars/avatar13.webp", "/avatars/avatar15.jpg",
];

interface Props {
  profile: {
    display_name: string | null;
    bio: string | null;
    avatar_url: string | null;
  };
}

export function EditProfileButton({ profile }: Props) {
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
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
        className="text-sm px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground transition-colors"
      >
        Editar perfil
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setOpen(false)}>
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold mb-4">Editar perfil</h3>
            <form onSubmit={save} className="space-y-4">

              {/* Avatar picker */}
              <div>
                <label className="block text-sm font-medium mb-2">Foto de perfil</label>
                <div className="grid grid-cols-6 gap-2">
                  {PRESET_AVATARS.map((src) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => setAvatarUrl(src)}
                      className="aspect-square rounded-full overflow-hidden transition-all"
                      style={avatarUrl === src ? { outline: "3px solid var(--gold)", outlineOffset: "3px" } : {}}
                    >
                      <img src={src} alt="Avatar" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Nombre visible</label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={50}
                  placeholder="Tu nombre"
                  className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={160}
                  rows={3}
                  className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">{bio.length}/160</p>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 rounded-md text-sm font-semibold disabled:opacity-50"
                  style={{ backgroundColor: "var(--gold)", color: "#0A0A0A" }}
                >
                  {saving ? "Guardando..." : "Guardar"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-md text-sm border border-border text-muted-foreground"
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

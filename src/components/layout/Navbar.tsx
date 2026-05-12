"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { SearchBar } from "./SearchBar";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { useState } from "react";

const links = [
  { href: "/movies", label: "Películas" },
  { href: "/series", label: "Series" },
  { href: "/anime", label: "Anime" },
  { href: "/lists", label: "Listas" },
  { href: "/feed", label: "Actividad" },
];


export function Navbar({ username, avatarUrl, unreadNotifications }: { username: string; avatarUrl?: string | null; unreadNotifications?: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => window.history.back()}
        className="fixed top-3 left-4 z-[51] h-12 flex items-center transition-opacity hover:opacity-70"
        aria-label="Volver"
        style={{ color: "var(--gold)" }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <div className="fixed top-3 left-0 right-0 z-50 px-4">
        <nav className="mx-auto max-w-5xl rounded-2xl border border-border bg-background/90 backdrop-blur shadow-xl">
          <div className="flex items-center justify-between px-4 h-12">
            {/* Izquierda: logo + links */}
            <div className="flex items-center gap-5">
              <Link href="/home" className="flex-shrink-0">
                <img src="/claquetabuena.png" alt="Filmedia" className="h-8 w-auto" />
              </Link>
              <div className="hidden md:flex items-center gap-1">
                {links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                      pathname.startsWith(l.href)
                        ? "text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Derecha: buscar · notifs · divisor · avatar */}
            <div className="flex items-center gap-3">
              <SearchBar />
              <div className="hidden sm:flex ml-2">
                <NotificationsDropdown unreadCount={unreadNotifications} />
              </div>
              <div className="hidden sm:block w-px h-4 bg-border" />
              <Link href={`/u/${username}`} className="hidden sm:block flex-shrink-0 hover:opacity-80 transition-opacity">
                <div className="w-7 h-7 rounded-full overflow-hidden border border-border">
                  {avatarUrl
                    ? <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
                    : <div className="w-full h-full" style={{ backgroundColor: "var(--gold)" }} />
                  }
                </div>
              </Link>
              {/* Hamburger móvil */}
              <button
                onClick={() => setMobileOpen((v) => !v)}
                className="md:hidden flex flex-col gap-1.5 p-1"
                aria-label="Menú"
              >
                <span className={`block w-5 h-0.5 bg-foreground transition-transform ${mobileOpen ? "rotate-45 translate-y-2" : ""}`} />
                <span className={`block w-5 h-0.5 bg-foreground transition-opacity ${mobileOpen ? "opacity-0" : ""}`} />
                <span className={`block w-5 h-0.5 bg-foreground transition-transform ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`} />
              </button>
            </div>
          </div>

          {/* Menú móvil desplegable */}
          {mobileOpen && (
            <div className="md:hidden border-t border-border bg-background px-4 py-3 flex flex-col gap-1 rounded-b-2xl">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className={`px-3 py-2 rounded-md text-sm transition-colors ${
                    pathname.startsWith(l.href)
                      ? "text-foreground font-medium bg-secondary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {l.label}
                </Link>
              ))}
              <div className="border-t border-border mt-2 pt-2 flex flex-col gap-1">
                <div className="px-3 py-2">
                  <NotificationsDropdown unreadCount={unreadNotifications} />
                </div>
                <Link href={`/u/${username}`} onClick={() => setMobileOpen(false)} className="px-3 py-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-6 h-6 rounded-full overflow-hidden border border-border flex-shrink-0">
                    {avatarUrl
                      ? <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
                      : <div className="w-full h-full" style={{ backgroundColor: "var(--gold)" }} />
                    }
                  </div>
                  Ver perfil
                </Link>
                <button onClick={handleLogout} className="px-3 py-2 text-sm text-destructive text-left hover:bg-secondary transition-colors rounded-md">
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </nav>
      </div>
    </>
  );
}

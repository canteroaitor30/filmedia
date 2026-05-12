"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { SearchBar } from "./SearchBar";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";

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
        <ChevronLeft size={20} strokeWidth={2.5} />
      </button>
      <div className="fixed top-3 left-0 right-0 z-50 px-4">
        <nav className="mx-auto max-w-5xl rounded-2xl border border-border/60 bg-background/90 backdrop-blur-md shadow-2xl">
          <div className="flex items-center justify-between px-4 h-12">
            {/* Left: logo + links */}
            <div className="flex items-center gap-5">
              <Link href="/home" className="flex-shrink-0">
                <img src="/claquetabuena.png" alt="Filmedia" className="h-8 w-auto" />
              </Link>
              <div className="hidden md:flex items-center gap-0.5">
                {links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      pathname.startsWith(l.href)
                        ? "text-foreground font-semibold bg-secondary/60"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                    }`}
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right: search · notifs · divider · avatar */}
            <div className="flex items-center gap-3">
              <SearchBar />
              <div className="hidden sm:flex ml-1">
                <NotificationsDropdown unreadCount={unreadNotifications} />
              </div>
              <div className="hidden sm:block w-px h-4 bg-border/60" />
              <Link href={`/u/${username}`} className="hidden sm:block flex-shrink-0 hover:opacity-80 transition-opacity">
                <div className="w-7 h-7 rounded-full overflow-hidden border border-border/60 ring-1 ring-transparent hover:ring-[var(--gold)]/40 transition-all">
                  {avatarUrl
                    ? <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
                    : <div className="w-full h-full" style={{ backgroundColor: "var(--gold)" }} />
                  }
                </div>
              </Link>
              {/* Hamburger mobile */}
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

          {/* Mobile menu */}
          {mobileOpen && (
            <div className="md:hidden border-t border-border/60 bg-background/95 px-4 py-3 flex flex-col gap-1 rounded-b-2xl">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                    pathname.startsWith(l.href)
                      ? "text-foreground font-semibold bg-secondary/60"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                  }`}
                >
                  {l.label}
                </Link>
              ))}
              <div className="border-t border-border/50 mt-2 pt-2 flex flex-col gap-1">
                <div className="px-3 py-2">
                  <NotificationsDropdown unreadCount={unreadNotifications} />
                </div>
                <Link href={`/u/${username}`} onClick={() => setMobileOpen(false)} className="px-3 py-2 flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/40">
                  <div className="w-6 h-6 rounded-full overflow-hidden border border-border/60 flex-shrink-0">
                    {avatarUrl
                      ? <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
                      : <div className="w-full h-full" style={{ backgroundColor: "var(--gold)" }} />
                    }
                  </div>
                  Ver perfil
                </Link>
                <button onClick={handleLogout} className="px-3 py-2 text-sm text-destructive text-left hover:bg-secondary/40 transition-colors rounded-lg">
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

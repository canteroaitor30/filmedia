"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { SearchBar } from "./SearchBar";
import { useState } from "react";

const links = [
  { href: "/home", label: "Inicio" },
  { href: "/feed", label: "Actividad" },
  { href: "/movies", label: "Películas" },
  { href: "/series", label: "Series" },
  { href: "/anime", label: "Anime" },
  { href: "/lists", label: "Listas" },
];

export function Navbar({ username, unreadNotifications }: { username: string; unreadNotifications?: number }) {
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
      <nav className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 md:px-6 h-14">
          {/* Logo + links desktop */}
          <div className="flex items-center gap-6">
            <Link href="/home" className="text-lg font-bold flex-shrink-0" style={{ color: "var(--gold)" }}>
              Filmedia
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

          {/* Derecha */}
          <div className="flex items-center gap-3">
            <SearchBar />
            <Link href="/notifications" className="hidden sm:flex relative items-center text-muted-foreground hover:text-foreground transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {!!unreadNotifications && unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full" style={{ backgroundColor: "var(--gold)", color: "#0A0A0A" }}>
                  {unreadNotifications > 9 ? "9+" : unreadNotifications}
                </span>
              )}
            </Link>
            <Link href={`/u/${username}`} className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors">
              @{username}
            </Link>
            <button onClick={handleLogout} className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors">
              Salir
            </button>
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
          <div className="md:hidden border-t border-border bg-background px-4 py-3 flex flex-col gap-1">
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
              <Link href="/notifications" onClick={() => setMobileOpen(false)} className="px-3 py-2 text-sm text-muted-foreground flex items-center justify-between">
                <span>Notificaciones</span>
                {!!unreadNotifications && unreadNotifications > 0 && (
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "var(--gold)", color: "#0A0A0A" }}>
                    {unreadNotifications}
                  </span>
                )}
              </Link>
              <Link href={`/u/${username}`} onClick={() => setMobileOpen(false)} className="px-3 py-2 text-sm text-muted-foreground">
                @{username}
              </Link>
              <button onClick={handleLogout} className="px-3 py-2 text-sm text-muted-foreground text-left hover:text-destructive transition-colors">
                Cerrar sesión
              </button>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}

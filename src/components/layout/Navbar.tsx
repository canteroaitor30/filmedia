"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const links = [
  { href: "/home", label: "Inicio" },
  { href: "/movies", label: "Películas" },
  { href: "/series", label: "Series" },
  { href: "/anime", label: "Anime" },
];

export function Navbar({ username }: { username: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 h-14">
        <div className="flex items-center gap-8">
          <Link href="/home" className="text-lg font-bold" style={{ color: "var(--gold)" }}>
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
        <div className="flex items-center gap-4">
          <Link href={`/u/${username}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            @{username}
          </Link>
          <button onClick={handleLogout} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Salir
          </button>
        </div>
      </div>
    </nav>
  );
}

import { createClient } from "@/lib/supabase/server";
import { BarChart3 } from "lucide-react";

interface Props { userId: string }

function Bar({ label, value, max, suffix = "" }: { label: string; value: number; max: number; suffix?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 group">
      <span className="text-xs text-muted-foreground w-28 flex-shrink-0 truncate group-hover:text-foreground transition-colors">{label}</span>
      <div className="flex-1 bg-secondary/60 rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: "var(--gold)", opacity: pct > 0 ? 1 : 0.15 }}
        />
      </div>
      <span className="text-xs tabular-nums w-8 text-right text-muted-foreground">{value}{suffix}</span>
    </div>
  );
}

function SectionTitle({ label }: { label: string }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">{label}</h3>
  );
}

export async function StatsTab({ userId }: Props) {
  const supabase = await createClient();

  const { data: allItems } = await supabase
    .from("user_media")
    .select("media_type, external_id, status, rating, platform, updated_at")
    .eq("user_id", userId);

  const items = allItems ?? [];
  const watched = items.filter((i) => i.status === "watched");
  const pending = items.filter((i) => i.status === "pending");
  const rated = watched.filter((i) => i.rating !== null);

  // Rating distribution
  const ratingBuckets: Record<string, number> = {};
  for (const r of [5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1]) {
    ratingBuckets[String(r)] = rated.filter((i) => i.rating === r).length;
  }
  const maxRating = Math.max(...Object.values(ratingBuckets), 1);

  // By type
  const byType = {
    movie: watched.filter((i) => i.media_type === "movie").length,
    series: watched.filter((i) => i.media_type === "series").length,
    anime: watched.filter((i) => i.media_type === "anime").length,
  };
  const maxType = Math.max(...Object.values(byType), 1);

  // By platform
  const platformCounts: Record<string, number> = {};
  for (const i of watched) {
    if (i.platform) platformCounts[i.platform] = (platformCounts[i.platform] ?? 0) + 1;
  }
  const sortedPlatforms = Object.entries(platformCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxPlatform = sortedPlatforms[0]?.[1] ?? 1;

  // Monthly activity (last 12 months)
  const now = new Date();
  const months: { label: string; key: string }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("es-ES", { month: "short" });
    months.push({ label, key });
  }
  const monthlyCounts: Record<string, number> = {};
  for (const i of items) {
    const key = i.updated_at.slice(0, 7);
    monthlyCounts[key] = (monthlyCounts[key] ?? 0) + 1;
  }
  const maxMonthly = Math.max(...months.map((m) => monthlyCounts[m.key] ?? 0), 1);

  // Genre stats from media_cache
  const watchedIds = { movie: watched.filter(i => i.media_type === "movie").map(i => i.external_id), series: watched.filter(i => i.media_type === "series").map(i => i.external_id), anime: watched.filter(i => i.media_type === "anime").map(i => i.external_id) };
  const cacheResults = await Promise.all([
    watchedIds.movie.length ? supabase.from("media_cache").select("genres, runtime_minutes").eq("media_type", "movie").in("external_id", watchedIds.movie) : Promise.resolve({ data: [] }),
    watchedIds.series.length ? supabase.from("media_cache").select("genres, runtime_minutes").eq("media_type", "series").in("external_id", watchedIds.series) : Promise.resolve({ data: [] }),
    watchedIds.anime.length ? supabase.from("media_cache").select("genres, runtime_minutes").eq("media_type", "anime").in("external_id", watchedIds.anime) : Promise.resolve({ data: [] }),
  ]);
  const cachedItems = [...(cacheResults[0].data ?? []), ...(cacheResults[1].data ?? []), ...(cacheResults[2].data ?? [])] as { genres: string[]; runtime_minutes: number | null }[];

  const genreCounts: Record<string, number> = {};
  let totalMinutes = 0;
  for (const c of cachedItems) {
    for (const g of (c.genres ?? [])) genreCounts[g] = (genreCounts[g] ?? 0) + 1;
    if (c.runtime_minutes) totalMinutes += c.runtime_minutes;
  }
  const topGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxGenre = topGenres[0]?.[1] ?? 1;
  const totalHours = Math.round(totalMinutes / 60);

  const avgRating = rated.length ? (rated.reduce((s, i) => s + (i.rating ?? 0), 0) / rated.length).toFixed(1) : null;

  if (watched.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ backgroundColor: "color-mix(in srgb, var(--gold) 10%, transparent)" }}>
          <BarChart3 size={24} style={{ color: "var(--gold)" }} />
        </div>
        <p className="font-semibold text-foreground">Aún no hay estadísticas</p>
        <p className="text-sm mt-1">Marca contenido como visto para ver tus datos</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Vistos", value: watched.length, sub: "títulos" },
          { label: "Pendientes", value: pending.length, sub: "en lista" },
          { label: "Nota media", value: avgRating ?? "—", sub: "sobre 5" },
          { label: "Horas vistas", value: totalHours > 0 ? totalHours : "—", sub: "estimado" },
        ].map((card) => (
          <div key={card.label} className="bg-card/50 border border-border/60 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold tabular-nums tracking-tight" style={{ color: "var(--gold)" }}>{card.value}</p>
            <p className="text-xs font-semibold mt-1">{card.label}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Rating distribution */}
      {rated.length > 0 && (
        <section className="bg-card/30 border border-border/40 rounded-xl p-4">
          <SectionTitle label="Distribución de notas" />
          <div className="space-y-2">
            {[5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1].map((r) => (
              <Bar key={r} label={`${r} ★`} value={ratingBuckets[String(r)]} max={maxRating} />
            ))}
          </div>
        </section>
      )}

      {/* By type */}
      {watched.length > 0 && (
        <section className="bg-card/30 border border-border/40 rounded-xl p-4">
          <SectionTitle label="Por tipo" />
          <div className="space-y-2">
            <Bar label="Películas" value={byType.movie} max={maxType} />
            <Bar label="Series" value={byType.series} max={maxType} />
            <Bar label="Anime" value={byType.anime} max={maxType} />
          </div>
        </section>
      )}

      {/* Top genres */}
      {topGenres.length > 0 && (
        <section className="bg-card/30 border border-border/40 rounded-xl p-4">
          <SectionTitle label="Géneros favoritos" />
          <div className="space-y-2">
            {topGenres.map(([genre, count]) => (
              <Bar key={genre} label={genre} value={count} max={maxGenre} />
            ))}
          </div>
        </section>
      )}

      {/* By platform */}
      {sortedPlatforms.length > 0 && (
        <section className="bg-card/30 border border-border/40 rounded-xl p-4">
          <SectionTitle label="Por plataforma" />
          <div className="space-y-2">
            {sortedPlatforms.map(([p, count]) => (
              <Bar key={p} label={p} value={count} max={maxPlatform} />
            ))}
          </div>
        </section>
      )}

      {/* Monthly activity */}
      {items.length > 0 && (
        <section className="bg-card/30 border border-border/40 rounded-xl p-4">
          <SectionTitle label="Actividad mensual" />
          <div className="flex items-end gap-1 h-20">
            {months.map((m) => {
              const count = monthlyCounts[m.key] ?? 0;
              const height = maxMonthly > 0 ? Math.max((count / maxMonthly) * 100, count > 0 ? 8 : 0) : 0;
              return (
                <div key={m.key} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-sm transition-all duration-500"
                    style={{
                      height: `${height}%`,
                      backgroundColor: "var(--gold)",
                      opacity: count > 0 ? 1 : 0.1,
                    }}
                  />
                  <span className="text-[9px] text-muted-foreground/70">{m.label}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";

interface Props { userId: string }

function Bar({ label, value, max, suffix = "" }: { label: string; value: number; max: number; suffix?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-24 flex-shrink-0 truncate">{label}</span>
      <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: "var(--gold)" }} />
      </div>
      <span className="text-xs tabular-nums w-10 text-right">{value}{suffix}</span>
    </div>
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

  return (
    <div className="space-y-8">
      {/* Header cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Vistos", value: watched.length },
          { label: "Pendientes", value: pending.length },
          { label: "Nota media", value: avgRating ?? "—" },
          { label: "Horas (estimado)", value: totalHours > 0 ? `${totalHours}h` : "—" },
        ].map((card) => (
          <div key={card.label} className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Rating distribution */}
      {rated.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold mb-3">Distribución de notas</h3>
          <div className="space-y-1.5">
            {[5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1].map((r) => (
              <Bar key={r} label={`${r}★`} value={ratingBuckets[String(r)]} max={maxRating} />
            ))}
          </div>
        </section>
      )}

      {/* By type */}
      {watched.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold mb-3">Por tipo</h3>
          <div className="space-y-1.5">
            <Bar label="Películas" value={byType.movie} max={maxType} />
            <Bar label="Series" value={byType.series} max={maxType} />
            <Bar label="Anime" value={byType.anime} max={maxType} />
          </div>
        </section>
      )}

      {/* Top genres */}
      {topGenres.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold mb-3">Géneros favoritos</h3>
          <div className="space-y-1.5">
            {topGenres.map(([genre, count]) => (
              <Bar key={genre} label={genre} value={count} max={maxGenre} />
            ))}
          </div>
        </section>
      )}

      {/* By platform */}
      {sortedPlatforms.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold mb-3">Por plataforma</h3>
          <div className="space-y-1.5">
            {sortedPlatforms.map(([p, count]) => (
              <Bar key={p} label={p} value={count} max={maxPlatform} />
            ))}
          </div>
        </section>
      )}

      {/* Monthly activity */}
      {items.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold mb-3">Actividad mensual</h3>
          <div className="flex items-end gap-1 h-20">
            {months.map((m) => {
              const count = monthlyCounts[m.key] ?? 0;
              const height = maxMonthly > 0 ? Math.max((count / maxMonthly) * 100, count > 0 ? 8 : 0) : 0;
              return (
                <div key={m.key} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-sm transition-all" style={{ height: `${height}%`, backgroundColor: "var(--gold)", opacity: count > 0 ? 1 : 0.15 }} />
                  <span className="text-[9px] text-muted-foreground">{m.label}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {watched.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-4xl mb-3">📊</p>
          <p>Aún no hay datos suficientes para mostrar estadísticas.</p>
        </div>
      )}
    </div>
  );
}

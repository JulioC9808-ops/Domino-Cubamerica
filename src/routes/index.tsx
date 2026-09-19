import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppNav } from "@/components/AppNav";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { tierOf } from "@/lib/domino/levels";
import { VARIANTS } from "@/lib/domino/engine";
import { FLAGS } from "@/lib/domino/themes";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Domino — Dominó cubano online, doble 6 y doble 9" },
      {
        name: "description",
        content:
          "Dominó cubano online: doble 6 o doble 9, en pareja o 1 vs 1, con ranking, niveles, torneos y chat rápido sin trampas.",
      },
      { property: "og:title", content: "Domino — Dominó cubano online" },
      {
        property: "og:description",
        content: "Doble 6 o doble 9, en pareja o 1 vs 1, con ranking, niveles y torneos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type TopRow = { id: string; username: string; flag: string; level: number; elo: number };
type Tournament = {
  id: string;
  name: string;
  mode: string;
  status: string;
  max_players: number;
  starts_at: string | null;
  reward_description: string | null;
};

function Index() {
  const { user } = useAuth();
  const { profile, progress } = useProfile(user?.id);
  const tier = tierOf(profile?.elo ?? 1000);
  const [top, setTop] = useState<TopRow[]>([]);
  const [torneos, setTorneos] = useState<Tournament[]>([]);

  useEffect(() => {
    void (async () => {
      const [topRes, tRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, username, flag, level, elo")
          .order("elo", { ascending: false })
          .limit(10),
        supabase
          .from("tournaments")
          .select("id, name, mode, status, max_players, starts_at, reward_description")
          .in("status", ["open", "running"])
          .order("created_at", { ascending: false })
          .limit(3),
      ]);
      setTop((topRes.data ?? []) as TopRow[]);
      setTorneos((tRes.data ?? []) as Tournament[]);
    })();
  }, []);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6">
      <AppNav />

      <header className="mb-6">
        <h1 className="font-display text-4xl font-extrabold">
          <span className="gold-text">Domino</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Dominó cubano · doble 6 y doble 9 · en pareja o 1 vs 1
        </p>
      </header>

      {profile ? (
        <section className="glass-panel mb-5 rounded-2xl p-4">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-bold">{profile.username}</p>
              <p className="text-xs text-muted-foreground">
                ID {profile.player_code} · {tier.label} ({profile.elo})
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-display text-2xl font-bold text-gold">Nv {progress.level}</p>
              <p className="text-[11px] text-muted-foreground">
                {progress.into}/{progress.need} XP
              </p>
            </div>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(100, (progress.into / progress.need) * 100)}%` }}
            />
          </div>
        </section>
      ) : (
        <section className="glass-panel mb-5 rounded-2xl p-4">
          <p className="text-sm text-muted-foreground">
            Entra con tu cuenta para guardar tu nivel, ranking y amigos.
          </p>
          <Link
            to="/auth"
            className="mt-3 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
          >
            Iniciar sesión
          </Link>
        </section>
      )}

      <section className="grid gap-3 sm:grid-cols-2">
        {VARIANTS.map((v) => (
          <Link
            key={v.id}
            to="/jugar"
            search={{ v: v.id }}
            className="hover-lift glass-panel rounded-2xl p-4"
          >
            <p className="font-display text-lg font-bold">{v.label}</p>
            <p className="text-xs text-muted-foreground">
              {v.variant.mode === "pairs" ? "4 jugadores, 2 parejas" : "Mano a mano"} · a 100 puntos
            </p>
          </Link>
        ))}
      </section>

      <section className="mt-5 grid gap-4 sm:grid-cols-2">
        {/* TOP 10 */}
        <div className="glass-panel rounded-2xl p-4">
          <h2 className="font-display text-lg font-bold">🏆 Top 10</h2>
          <ol className="mt-2 divide-y divide-border">
            {top.map((r, i) => (
              <li key={r.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 py-1.5">
                <span className="w-5 text-center text-xs font-bold text-gold">{i + 1}</span>
                <span className="min-w-0 truncate text-sm">
                  {FLAGS.find((f) => f.code === r.flag)?.emoji ?? "🇨🇺"} {r.username}
                </span>
                <span className="text-xs text-muted-foreground">{r.elo}</span>
              </li>
            ))}
            {!top.length ? (
              <li className="py-2 text-sm text-muted-foreground">Aún no hay jugadores clasificados.</li>
            ) : null}
          </ol>
          <Link to="/ranking" className="mt-3 inline-block text-xs font-semibold text-gold hover:underline">
            Ver ranking completo →
          </Link>
        </div>

        {/* TORNEOS */}
        <div className="glass-panel rounded-2xl p-4">
          <h2 className="font-display text-lg font-bold">🏅 Torneos</h2>
          <div className="mt-2 divide-y divide-border">
            {torneos.map((t) => (
              <div key={t.id} className="py-2">
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="text-xs text-muted-foreground">
                  {t.mode === "pairs" ? "En pareja" : "Individual"} · llave de {t.max_players}
                  {t.starts_at ? ` · ${new Date(t.starts_at).toLocaleDateString("es")}` : ""}
                </p>
                {t.reward_description ? (
                  <p className="mt-0.5 text-xs text-gold">Premio: {t.reward_description}</p>
                ) : null}
              </div>
            ))}
            {!torneos.length ? (
              <p className="py-2 text-sm text-muted-foreground">Aún no hay torneos abiertos.</p>
            ) : null}
          </div>
          <Link to="/torneos" className="mt-3 inline-block text-xs font-semibold text-gold hover:underline">
            Ver torneos →
          </Link>
        </div>
      </section>
    </main>
  );
}

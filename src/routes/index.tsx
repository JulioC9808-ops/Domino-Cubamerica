import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppNav } from "@/components/AppNav";
import { WebFooter } from "@/components/WebFooter";
import { DominoTile } from "@/components/domino/DominoTile";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { tierOf } from "@/lib/domino/levels";
import { VARIANTS } from "@/lib/domino/engine";
import { FLAGS } from "@/lib/domino/themes";
import { useI18n } from "@/lib/i18n";

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
  const { t } = useI18n();
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
        <div className="flex items-center gap-3">
          <h1 className="font-display text-4xl font-extrabold">
            <span className="gold-text">Domino</span>
          </h1>
          <div className="flex items-center -rotate-6 transition-transform duration-200 hover:rotate-0 hover:scale-105">
            <DominoTile
              tile={{ a: 6, b: 6 }}
              orientation="v"
              size="sm"
              className="shadow-tile ring-1 ring-gold/40"
            />
          </div>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{t("home.tagline")}</p>
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
              <p className="font-display text-2xl font-bold text-gold">
                {t("home.level")} {progress.level}
              </p>
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
          <p className="text-sm text-muted-foreground">{t("home.loginPrompt")}</p>
          <Link
            to="/auth"
            className="mt-3 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
          >
            {t("home.loginBtn")}
          </Link>
        </section>
      )}

      {/* JUGAR CONTRA BOTS */}
      <section className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <h2 className="font-display text-lg font-bold">{t("home.playBots")}</h2>
          </div>
          <span className="rounded-full border border-border bg-card/60 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            {t("home.noLogin")}
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {VARIANTS.map((v) => (
            <Link
              key={v.id}
              to="/jugar"
              search={{ v: v.id }}
              className="hover-lift glass-panel group rounded-2xl p-4 transition-colors hover:border-gold/50"
            >
              <div className="flex items-center justify-between">
                <p className="font-display text-lg font-bold group-hover:text-gold">{v.label}</p>
                <span className="text-xs text-gold">Jugar gratis →</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {v.variant.mode === "pairs" ? "4 jugadores, 2 parejas (Bots)" : "Mano a mano (Bot)"}{" "}
                · a 100 puntos
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* JUGAR ONLINE Y CON AMIGOS */}
      <section className="mb-6 rounded-2xl border border-border/80 bg-card/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base">🌐</span>
              <h2 className="font-display text-lg font-bold">{t("home.onlineMatches")}</h2>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("home.requireAccount")}</p>
          </div>
          {!user ? (
            <Link
              to="/auth"
              className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground transition-transform hover:scale-105"
            >
              {t("home.loginBtn")}
            </Link>
          ) : (
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-400">
              Sesión activa
            </span>
          )}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Link
            to="/amigos"
            className="rounded-xl border border-border/60 bg-card/60 p-3 transition-colors hover:border-gold/50 hover:bg-card"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold">👥 {t("nav.friends")}</p>
              {!user && (
                <span className="text-[10px] text-muted-foreground">🔒 Obligatorio cuenta</span>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Busca rivales por nombre o ID e invítalos a tu mesa de dominó.
            </p>
          </Link>

          <Link
            to="/espectar"
            className="rounded-xl border border-border/60 bg-card/60 p-3 transition-colors hover:border-gold/50 hover:bg-card"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold">📡 {t("nav.live")}</p>
              {!user && (
                <span className="text-[10px] text-muted-foreground">🔒 Obligatorio cuenta</span>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Únete a mesas online multijugador o mira partidas en tiempo real.
            </p>
          </Link>
        </div>
      </section>

      <section className="mt-5 grid gap-4 sm:grid-cols-2">
        {/* TOP 10 */}
        <div className="glass-panel rounded-2xl p-4">
          <h2 className="font-display text-lg font-bold">🏆 {t("home.topRanking")}</h2>
          <ol className="mt-2 divide-y divide-border">
            {top.map((r, i) => (
              <li
                key={r.id}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 py-1.5"
              >
                <span className="w-5 text-center text-xs font-bold text-gold">{i + 1}</span>
                <span className="min-w-0 truncate text-sm">
                  {FLAGS.find((f) => f.code === r.flag)?.emoji ?? "🇨🇺"} {r.username}
                </span>
                <span className="text-xs text-muted-foreground">{r.elo}</span>
              </li>
            ))}
            {!top.length ? (
              <li className="py-2 text-sm text-muted-foreground">
                Aún no hay jugadores clasificados.
              </li>
            ) : null}
          </ol>
          <Link
            to="/ranking"
            className="mt-3 inline-block text-xs font-semibold text-gold hover:underline"
          >
            {t("home.viewRanking")}
          </Link>
        </div>

        {/* TORNEOS */}
        <div className="glass-panel rounded-2xl p-4">
          <h2 className="font-display text-lg font-bold">🏅 {t("home.activeTournaments")}</h2>
          <div className="mt-2 divide-y divide-border">
            {torneos.map((tItem) => (
              <div key={tItem.id} className="py-2">
                <p className="text-sm font-semibold">{tItem.name}</p>
                <p className="text-xs text-muted-foreground">
                  {tItem.mode === "pairs" ? "En pareja" : "Individual"} · llave de{" "}
                  {tItem.max_players}
                  {tItem.starts_at
                    ? ` · ${new Date(tItem.starts_at).toLocaleDateString("es")}`
                    : ""}
                </p>
                {tItem.reward_description ? (
                  <p className="mt-0.5 text-xs text-gold">Premio: {tItem.reward_description}</p>
                ) : null}
              </div>
            ))}
            {!torneos.length ? (
              <p className="py-2 text-sm text-muted-foreground">Aún no hay torneos abiertos.</p>
            ) : null}
          </div>
          <Link
            to="/torneos"
            className="mt-3 inline-block text-xs font-semibold text-gold hover:underline"
          >
            {t("home.viewAllTournaments")}
          </Link>
        </div>
      </section>

      {/* AYUDA Y GUÍA DE JUEGO */}
      <section className="glass-panel mt-5 rounded-2xl p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📖</span>
              <h2 className="font-display text-lg font-bold">{t("home.helpTitle")}</h2>
            </div>
            <p className="mt-1 max-w-xl text-xs text-muted-foreground">{t("home.helpDesc")}</p>
          </div>
          <Link
            to="/ayuda"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-gold/50 bg-gold/15 px-4 py-2 text-xs font-semibold text-gold transition-colors hover:bg-gold/25 self-start sm:self-auto"
          >
            {t("home.helpBtn")}
          </Link>
        </div>
      </section>

      {/* PIE DE PÁGINA VERSIÓN WEB */}
      <div className="mt-8">
        <WebFooter />
      </div>
    </main>
  );
}

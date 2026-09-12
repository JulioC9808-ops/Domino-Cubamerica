import { createFileRoute, Link } from "@tanstack/react-router";
import { AppNav } from "@/components/AppNav";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { tierOf } from "@/lib/domino/levels";
import { VARIANTS } from "@/lib/domino/engine";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Domino — Dominó cubano online, doble 6 y doble 9" },
      {
        name: "description",
        content:
          "Dominó cubano online: doble 6 o doble 9, en pareja o 1 vs 1, con ranking, niveles, amigos y chat rápido sin trampas.",
      },
      { property: "og:title", content: "Domino — Dominó cubano online" },
      {
        property: "og:description",
        content: "Doble 6 o doble 9, en pareja o 1 vs 1, con ranking, niveles y amigos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { user } = useAuth();
  const { profile, progress } = useProfile(user?.id);
  const tier = tierOf(profile?.elo ?? 1000);

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
    </main>
  );
}

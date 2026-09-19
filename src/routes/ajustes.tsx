import { createFileRoute, Link } from "@tanstack/react-router";
import { AppNav } from "@/components/AppNav";
import { Flag } from "@/components/Flag";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { getTheme } from "@/lib/domino/themes";
import { unlocksFor, getSkin, FRAME_RING, isFlagUnlocked, detectCountry } from "@/lib/domino/levels";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ajustes")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Ajustes y personalización | Domino" },
      {
        name: "description",
        content:
          "Cambia tu nombre, bandera, tema de mesa, diseño de fichas y marco según tu nivel en Domino.",
      },
      { property: "og:title", content: "Ajustes de Domino" },
      { property: "og:description", content: "Personaliza tu mesa, bandera y fichas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Ajustes,
});

function Ajustes() {
  const { user } = useAuth();
  const { profile, update, progress } = useProfile(user?.id);

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-6">
        <AppNav />
        <p className="text-sm text-muted-foreground">Entra con tu cuenta para ver los ajustes.</p>
        <Link to="/auth" className="mt-3 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">
          Iniciar sesión
        </Link>
      </main>
    );
  }

  const level = progress.level;
  const myCountry = detectCountry();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6">
      <AppNav />
      <h1 className="font-display text-3xl font-extrabold">Ajustes</h1>
      <p className="mt-1 text-xs text-muted-foreground">
        Nivel {level} · ID {profile?.player_code ?? "—"}
      </p>

      <section className="glass-panel mt-5 grid gap-3 rounded-2xl p-4">
        <label className="text-xs uppercase tracking-widest text-muted-foreground">Nombre</label>
        <input
          defaultValue={profile?.username ?? ""}
          onBlur={(e) => void update({ username: e.target.value.trim().slice(0, 24) })}
          className="rounded-xl border border-input bg-card px-3 py-2 text-sm"
        />
      </section>

      <Unlock
        title="Tema de mesa"
        kind="theme"
        level={level}
        current={profile?.table_theme ?? "madera"}
        onPick={(id) => void update({ table_theme: id })}
        preview={(id) => (
          <span
            className="block h-6 w-6 rounded-full border border-white/20"
            style={{ background: getTheme(id).felt }}
          />
        )}
      />

      <Unlock
        title="Diseño de fichas"
        kind="skin"
        level={level}
        current={profile?.tile_skin ?? "hueso"}
        onPick={(id) => void update({ tile_skin: id })}
        preview={(id) => (
          <span
            className="block h-6 w-6 rounded-md border border-white/20"
            style={{ background: getSkin(id).bone }}
          />
        )}
      />

      <Unlock
        title="Bandera de la mesa"
        kind="flag"
        level={level}
        current={profile?.flag ?? "cu"}
        onPick={(id) => void update({ flag: id })}
        customUnlocked={(id) => isFlagUnlocked(id, level, myCountry)}
        preview={(id) => <Flag code={id} size={20} />}
      />

      <Unlock
        title="Marco de avatar"
        kind="frame"
        level={level}
        current={profile?.frame ?? "none"}
        onPick={(id) => void update({ frame: id })}
        preview={(id) => (
          <span className="block h-5 w-5 rounded-full" style={{ border: FRAME_RING[id] }} />
        )}
      />

      <Unlock
        title="Título"
        kind="title"
        level={level}
        current={profile?.title ?? "novato"}
        onPick={(id) => void update({ title: id })}
      />

      <button
        onClick={() => void supabase.auth.signOut()}
        className="mt-6 rounded-full border border-border px-5 py-2 text-sm font-semibold text-destructive"
      >
        Cerrar sesión
      </button>
    </main>
  );
}

function Unlock({
  title,
  kind,
  level,
  current,
  onPick,
  preview,
  customUnlocked,
}: {
  title: string;
  kind: "theme" | "skin" | "frame" | "flag" | "title";
  level: number;
  current: string;
  onPick: (id: string) => void;
  preview?: (id: string) => React.ReactNode;
  /** si se define, decide el desbloqueo en lugar del nivel (ej: bandera de tu país gratis) */
  customUnlocked?: (id: string) => boolean;
}) {
  const items = unlocksFor(kind);
  return (
    <section className="glass-panel mt-4 rounded-2xl p-4">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((u) => {
          const locked = customUnlocked ? !customUnlocked(u.id) : level < u.level;
          return (
            <button
              key={u.id}
              disabled={locked}
              onClick={() => onPick(u.id)}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors",
                current === u.id ? "border-gold text-gold" : "border-border",
                locked && "cursor-not-allowed opacity-45",
              )}
            >
              {preview?.(u.id)}
              <span>{u.label}</span>
              {locked ? <span className="text-[10px]">🔒 Nv {u.level}</span> : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}

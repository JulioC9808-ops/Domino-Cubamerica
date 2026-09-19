import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppNav } from "@/components/AppNav";
import { supabase } from "@/integrations/supabase/client";

type Tournament = {
  id: string;
  name: string;
  mode: string;
  status: string;
  max_players: number;
  reward_description: string | null;
  starts_at: string | null;
};

export const Route = createFileRoute("/torneos")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Torneos | Domino" },
      { name: "description", content: "Torneos de dominó cubano: llave de 32 en parejas o individual." },
    ],
  }),
  component: Torneos,
});

const STATUS: Record<string, { label: string; cls: string }> = {
  open: { label: "Inscripción abierta", cls: "text-gold" },
  running: { label: "En juego", cls: "text-primary" },
  finished: { label: "Terminado", cls: "text-muted-foreground" },
  cancelled: { label: "Cancelado", cls: "text-destructive" },
};

function Torneos() {
  const [rows, setRows] = useState<Tournament[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("tournaments")
        .select("id, name, mode, status, max_players, reward_description, starts_at")
        .order("created_at", { ascending: false })
        .limit(20);
      setRows((data ?? []) as Tournament[]);
      setLoaded(true);
    })();
  }, []);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6">
      <AppNav />
      <h1 className="font-display text-3xl font-extrabold">Torneos</h1>
      <p className="mt-1 text-xs text-muted-foreground">
        Llave de 32 en grupos de 4 · avanza el ganador de cada mesa hasta la final.
      </p>

      <div className="mt-4 grid gap-3">
        {rows.map((t) => (
          <div key={t.id} className="glass-panel rounded-2xl p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-display text-lg font-bold">{t.name}</p>
              <span className={`shrink-0 text-xs font-semibold ${STATUS[t.status]?.cls ?? ""}`}>
                {STATUS[t.status]?.label ?? t.status}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {t.mode === "pairs" ? "En pareja" : "Individual"} · llave de {t.max_players}
              {t.starts_at ? ` · empieza ${new Date(t.starts_at).toLocaleString("es")}` : ""}
            </p>
            {t.reward_description ? <p className="mt-1 text-xs text-gold">Premio: {t.reward_description}</p> : null}
          </div>
        ))}
        {loaded && !rows.length ? (
          <p className="glass-panel rounded-2xl p-4 text-sm text-muted-foreground">
            No hay torneos todavía. El primero se crea desde el panel de administración.
          </p>
        ) : null}
      </div>

      <Link to="/" className="mt-6 inline-block text-sm text-muted-foreground hover:underline">
        ← Volver al inicio
      </Link>
    </main>
  );
}

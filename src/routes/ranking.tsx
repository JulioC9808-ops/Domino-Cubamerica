import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppNav } from "@/components/AppNav";
import { supabase } from "@/integrations/supabase/client";
import { FLAGS } from "@/lib/domino/themes";

type Row = { id: string; username: string; flag: string; level: number; elo: number };

export const Route = createFileRoute("/ranking")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Ranking de jugadores | Domino" },
      { name: "description", content: "Tabla de clasificación de Domino por puntos de ranking y nivel de cada jugador." },
      { property: "og:title", content: "Ranking de Domino" },
      { property: "og:description", content: "Los mejores jugadores de dominó cubano online." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Ranking,
});

function Ranking() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, flag, level, elo")
        .order("elo", { ascending: false })
        .limit(50);
      setRows((data ?? []) as Row[]);
    })();
  }, []);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6">
      <AppNav />
      <h1 className="font-display text-3xl font-extrabold">Ranking</h1>
      <ol className="glass-panel mt-4 divide-y divide-border rounded-2xl p-2">
        {rows.map((r, i) => (
          <li key={r.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-2 py-2">
            <span className="w-6 shrink-0 text-center font-display text-sm font-bold text-gold">{i + 1}</span>
            <span className="min-w-0 truncate text-sm font-semibold">
              {FLAGS.find((f) => f.code === r.flag)?.emoji ?? "🏳️"} {r.username}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground">Nv {r.level} · {r.elo}</span>
          </li>
        ))}
        {!rows.length ? <li className="px-2 py-4 text-sm text-muted-foreground">Aún no hay jugadores clasificados.</li> : null}
      </ol>
    </main>
  );
}

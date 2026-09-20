import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppNav } from "@/components/AppNav";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type Row = {
  id: string;
  username: string;
  flag: string;
  player_code: string;
  level: number;
  elo: number;
};

export const Route = createFileRoute("/amigos")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Amigos e invitaciones | Domino" },
      {
        name: "description",
        content: "Busca jugadores por nombre o ID personal e invítalos a tu mesa de dominó.",
      },
      { property: "og:title", content: "Amigos en Domino" },
      { property: "og:description", content: "Agrega amigos por nombre o ID y juega con ellos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Amigos,
});

function Amigos() {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [friends, setFriends] = useState<Row[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { data: links } = await supabase
        .from("friendships")
        .select("requester_id, addressee_id")
        .eq("status", "accepted")
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
      const ids = (links ?? [])
        .map((l) => (l.requester_id === user.id ? l.addressee_id : l.requester_id))
        .filter((id): id is string => Boolean(id));
      if (!ids.length) {
        setFriends([]);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("id, username, flag, player_code, level, elo")
        .in("id", ids);
      setFriends((data ?? []) as Row[]);
    })();
  }, [user?.id]);

  async function search() {
    const term = q.trim();
    if (!term) return;
    const { data } = await supabase
      .from("profiles")
      .select("id, username, flag, player_code, level, elo")
      .or(`username.ilike.%${term}%,player_code.ilike.%${term}%`)
      .limit(20);
    setRows((data ?? []) as Row[]);
  }

  async function add(id: string) {
    if (!user) return;
    const { error } = await supabase
      .from("friendships")
      .insert({ requester_id: user.id, addressee_id: id, status: "pending" });
    setMsg(error ? error.message : "Solicitud enviada.");
  }

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-6">
        <AppNav />
        <div className="glass-panel mt-4 rounded-3xl p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gold/15 text-gold text-2xl">
            👥
          </div>
          <h1 className="font-display text-2xl font-bold">Jugar con amigos</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Para jugar con amigos, agregarlos o enviar invitaciones es obligatorio iniciar sesión.
            El juego contra Bots está disponible de forma libre sin registro.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/auth"
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105"
            >
              Iniciar sesión o registrarse
            </Link>
            <Link
              to="/jugar"
              className="rounded-full border border-border px-5 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              Jugar contra Bots
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6">
      <AppNav />
      <h1 className="font-display text-3xl font-extrabold">Amigos</h1>

      <div className="mt-4 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void search()}
          placeholder="Nombre o ID personal"
          className="min-w-0 flex-1 rounded-xl border border-input bg-card px-3 py-2 text-sm"
        />
        <button
          onClick={() => void search()}
          className="shrink-0 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
        >
          Buscar
        </button>
      </div>
      {msg ? <p className="mt-2 text-xs text-muted-foreground">{msg}</p> : null}

      <List title="Resultados" rows={rows} action={add} />
      <List title="Mis amigos" rows={friends} />
    </main>
  );
}

function List({
  title,
  rows,
  action,
}: {
  title: string;
  rows: Row[];
  action?: (id: string) => void;
}) {
  if (!rows.length) return null;
  return (
    <section className="glass-panel mt-5 rounded-2xl p-4">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <ul className="mt-2 divide-y divide-border">
        {rows.map((r) => (
          <li key={r.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{r.username}</p>
              <p className="text-xs text-muted-foreground">
                ID {r.player_code} · Nv {r.level} · {r.elo}
              </p>
            </div>
            {action ? (
              <button
                onClick={() => action(r.id)}
                className="shrink-0 rounded-full border border-border px-3 py-1 text-xs"
              >
                Agregar
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

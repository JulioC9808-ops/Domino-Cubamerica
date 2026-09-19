import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppNav } from "@/components/AppNav";
import { GameTable, type SeatInfo } from "@/components/domino/GameTable";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { GameState } from "@/lib/domino/engine";
import { cn } from "@/lib/utils";

type Search = { room?: string };

export const Route = createFileRoute("/espectar")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): Search => ({
    room: typeof s["room"] === "string" ? (s["room"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Partidas en vivo | Domino" },
      { name: "description", content: "Mira partidas de dominó en curso como espectador." },
    ],
  }),
  component: Espectar,
});

type RoomRow = {
  id: string;
  code: string;
  name: string;
  status: string;
  theme: string;
  flag: string;
  target_score: number;
  max_players: number;
  player_count: number;
  created_at: string;
};
type PlayerRow = { user_id: string; seat: number; connected: boolean };
type ProfileRow = {
  id: string;
  username: string;
  flag: string;
  level: number;
  frame: string;
};

function Espectar() {
  const { room } = Route.useSearch();
  const { user } = useAuth();

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-6">
        <AppNav />
        <h1 className="font-display text-3xl font-extrabold">Partidas en vivo</h1>
        <p className="glass-panel mt-4 rounded-2xl p-4 text-sm text-muted-foreground">
          Entra con tu cuenta para mirar las partidas que se están jugando.
        </p>
        <Link
          to="/auth"
          className="mt-3 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
        >
          Iniciar sesión
        </Link>
      </main>
    );
  }

  return room ? <Viewer roomId={room} /> : <LiveList />;
}

/* ── LISTA DE SALAS EN JUEGO ── */
function LiveList() {
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("lobby_rooms")
      .select("id, code, name, status, theme, flag, target_score, max_players, player_count, created_at")
      .in("status", ["playing", "waiting"])
      .order("created_at", { ascending: false });
    setRooms((data ?? []) as RoomRow[]);
    setLoaded(true);
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 15_000); // refresco suave de la lista
    return () => clearInterval(id);
  }, [load]);

  const playing = rooms.filter((r) => r.status === "playing");
  const waiting = rooms.filter((r) => r.status === "waiting");

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6">
      <AppNav />
      <h1 className="font-display text-3xl font-extrabold">Partidas en vivo</h1>
      <p className="mt-1 text-xs text-muted-foreground">
        Salas públicas ahora mismo. Entra a mirar cualquier mesa en juego.
      </p>

      <div className="mt-4 grid gap-3">
        {playing.map((r) => (
          <Link
            key={r.id}
            to="/espectar"
            search={{ room: r.id }}
            className="glass-panel hover-lift rounded-2xl p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-display text-base font-bold">{r.name}</p>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-destructive">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-destructive" />
                EN VIVO
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {r.player_count}/{r.max_players} jugadores · a {r.target_score} puntos · sala {r.code}
            </p>
          </Link>
        ))}

        {waiting.map((r) => (
          <div key={r.id} className="glass-panel rounded-2xl p-4 opacity-75">
            <div className="flex items-center justify-between gap-3">
              <p className="font-display text-base font-bold">{r.name}</p>
              <span className="text-xs font-semibold text-muted-foreground">Esperando…</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {r.player_count}/{r.max_players} jugadores · sala {r.code}
            </p>
          </div>
        ))}

        {loaded && !rooms.length ? (
          <p className="glass-panel rounded-2xl p-4 text-sm text-muted-foreground">
            No hay salas activas ahora mismo. Cuando alguien abra una sala multiplayer
            pública, aparecerá aquí y podrás mirar su mesa en vivo.
          </p>
        ) : null}
      </div>
    </main>
  );
}

/* ── MESA EN VIVO ── */
function Viewer({ roomId }: { roomId: string }) {
  const [room, setRoom] = useState<RoomRow | null>(null);
  const [state, setState] = useState<GameState | null>(null);
  const [seats, setSeats] = useState<SeatInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function loadPlayers(roomPlayers: PlayerRow[]) {
      const ids = roomPlayers.map((p) => p.user_id);
      if (!ids.length) return;
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, username, flag, level, frame")
        .in("id", ids);
      const byId = new Map((profs ?? []).map((p) => [p.id, p]));
      return roomPlayers.map<PlayerRow & { info?: ProfileRow }>((p) => ({
        ...p,
        info: byId.get(p.user_id),
      }));
    }

    void (async () => {
      const [{ data: r }, { data: g }] = await Promise.all([
        supabase.from("lobby_rooms").select("*").eq("id", roomId).maybeSingle(),
        supabase.from("games").select("state").eq("room_id", roomId).maybeSingle(),
      ]);
      if (!alive) return;
      if (!r) {
        setError("Esta sala no existe o ya cerró.");
        return;
      }
      setRoom(r as RoomRow);

      const { data: players } = await supabase
        .from("room_players")
        .select("user_id, seat, connected")
        .eq("room_id", roomId);
      const enriched = (await loadPlayers((players ?? []) as PlayerRow[])) ?? [];
      if (!alive) return;

      if (g?.state) {
        const st = g.state as GameState;
        setState(st);
        // seats por asiento del estado (0..players-1); la mano del asiento 0 se OCULTA
        const playersCount = st.players;
        setSeats(
          Array.from({ length: playersCount }, (_, i) => {
            const p = enriched.find((x) => x.seat === i);
            return {
              name: p?.info?.username ?? `Jugador ${i + 1}`,
              flag: p?.info?.flag ?? "cu",
              level: p?.info?.level,
              frame: p?.info?.frame,
              connected: p?.connected ?? true,
            };
          }),
        );
      }
    })();

    // realtime: el tablero se actualiza solo con cada jugada
    const channel = supabase
      .channel(`spectate-${roomId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "games", filter: `room_id=eq.${roomId}` },
        (payload) => {
          const ns = payload.new?.state as GameState | undefined;
          if (ns) setState(ns);
        },
      )
      .subscribe();

    return () => {
      alive = false;
      void supabase.removeChannel(channel);
    };
  }, [roomId]);

  if (error) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-6">
        <AppNav />
        <p className="glass-panel mt-4 rounded-2xl p-4 text-sm text-muted-foreground">{error}</p>
        <Link to="/espectar" className="mt-3 inline-block text-sm text-gold hover:underline">
          ← Otras salas
        </Link>
      </main>
    );
  }

  if (!room || !state) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-6">
        <AppNav />
        <p className="glass-panel mt-4 animate-pulse rounded-2xl p-4 text-sm text-muted-foreground">
          Cargando mesa…
        </p>
      </main>
    );
  }

  //Anti-ventaja: el espectador NO ve la mano del asiento 0 (ni ninguna)
  const safeState: GameState = {
    ...state,
    hands: state.hands.map((h, i) => (i === 0 ? [] : h)),
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-3 py-5 sm:px-6">
      <AppNav />
      <header className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl font-extrabold">
            {room.name}{" "}
            <span className="ml-1 inline-flex items-center gap-1.5 align-middle text-xs font-semibold text-destructive">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-destructive" />
              EN VIVO
            </span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Modo espectador · a {room.target_score} puntos
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-4 rounded-2xl glass-panel px-4 py-2">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Pareja A</p>
            <p className="font-display text-2xl font-bold text-team-a">{state.scores[0]}</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Pareja B</p>
            <p className="font-display text-2xl font-bold text-team-b">{state.scores[1]}</p>
          </div>
        </div>
      </header>

      <div className="pointer-events-none">
        {/* onPlay/onPass nunca se ejecutan: el espectador no puede tocar nada */}
        <GameTable
          state={safeState}
          mySeat={0}
          seats={seats}
          themeId={room.theme}
          tileSkin="hueso"
          tableFlag={room.flag}
          thinkingSeat={state.turn}
          onPlay={() => {}}
          onPass={() => {}}
        />
      </div>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        Estás mirando en vivo — el tablero se actualiza solo con cada jugada.
      </p>

      <div className={cn("mt-4 text-center")}>
        <Link to="/espectar" className="text-sm text-gold hover:underline">
          ← Otras salas en vivo
        </Link>
      </div>
    </main>
  );
}

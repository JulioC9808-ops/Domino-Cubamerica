import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppNav } from "@/components/AppNav";
import { GameTable, type SeatInfo } from "@/components/domino/GameTable";
import { chooseBotMove } from "@/lib/domino/bot";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import type { ChatBubble } from "@/lib/domino/chat";
import {
  type GameState,
  type Side,
  type Tile,
  VARIANTS,
  createGame,
  nextHand,
  teamOfSeat,
  passTurn,
  playTile,
} from "@/lib/domino/engine";
import { cn } from "@/lib/utils";
import { initSfx, sfx } from "@/lib/sfx";

type Search = { v: string };

export const Route = createFileRoute("/jugar")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): Search => ({
    v: typeof s["v"] === "string" ? (s["v"] as string) : "pairs-6",
  }),
  head: () => ({
    meta: [
      { title: "Jugar dominó — mesa contra la máquina | Domino" },
      {
        name: "description",
        content:
          "Juega dominó cubano contra bots: doble 6 o doble 9, en pareja o 1 vs 1, con mesa animada y chat rápido.",
      },
      { property: "og:title", content: "Jugar dominó cubano" },
      { property: "og:description", content: "Mesa de dominó doble 6 o doble 9 contra la máquina." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Jugar,
});

const BOT_NAMES = ["Yuniel", "Marisol", "El Chino"];
const BOT_FLAGS = ["es", "mx", "do"];

function Jugar() {
  const { v } = Route.useSearch();
  const { user } = useAuth();
  const { profile, progress } = useProfile(user?.id);

  const preset = VARIANTS.find((x) => x.id === v) ?? VARIANTS[0]!;
  const [state, setState] = useState<GameState>(() =>
    createGame({ targetScore: 100, variant: preset.variant }),
  );
  const [thinking, setThinking] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [bubbles, setBubbles] = useState<ChatBubble[]>([]);

  useEffect(() => {
    initSfx();
  }, []);

  useEffect(() => {
    setState(createGame({ targetScore: 100, variant: preset.variant }));
    sfx.deal();
  }, [preset.id]);

  const themeId = profile?.table_theme ?? "habana";
  const tileSkin = profile?.tile_skin ?? "hueso";
  const tableFlag = profile?.flag ?? "cu";

  const seats: SeatInfo[] = Array.from({ length: state.players }, (_, i) =>
    i === 0
      ? {
          name: profile?.username ?? "Tú",
          flag: tableFlag,
          level: progress.level,
          frame: profile?.frame ?? "none",
        }
      : {
          name: BOT_NAMES[(i - 1) % BOT_NAMES.length]!,
          flag: BOT_FLAGS[(i - 1) % BOT_FLAGS.length]!,
          isBot: true,
        },
  );

  const notify = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  useEffect(() => {
    if (state.phase !== "playing" || state.turn === 0) {
      setThinking(null);
      return;
    }
    const seat = state.turn;
    setThinking(seat);
    const timer = setTimeout(() => {
      setState((cur) => {
        if (cur.phase !== "playing" || cur.turn !== seat) return cur;
        const move = chooseBotMove(cur, seat);
        const res = move ? playTile(cur, seat, move.tile, move.side) : passTurn(cur, seat);
        if (res.ok) {
          if (move) sfx.place();
          else sfx.pass();
        }
        return res.ok ? res.state : cur;
      });
      setThinking(null);
    }, 750);
    return () => clearTimeout(timer);
  }, [state.turn, state.phase, state.board.length]);

  function handlePlay(tile: Tile, side: Side) {
    setState((cur) => {
      const res = playTile(cur, 0, tile, side);
      if (!res.ok) {
        notify(res.error);
        return cur;
      }
      return res.state;
    });
  }

  function handlePass() {
    setState((cur) => {
      const res = passTurn(cur, 0);
      if (!res.ok) {
        notify(res.error);
        return cur;
      }
      return res.state;
    });
  }

  function say(text: string, emoji: string) {
    const bubble: ChatBubble = {
      id: `${Date.now()}-${Math.random()}`,
      seat: 0,
      text,
      emoji,
      at: Date.now(),
    };
    setBubbles((b) => [...b.slice(-5), bubble]);
    setTimeout(() => setBubbles((b) => b.filter((x) => x.id !== bubble.id)), 5000);
  }

  const last = state.events[state.events.length - 1];

  useEffect(() => {
    if (state.phase === "playing") return;
    if (state.phase === "game_over") {
      state.winnerTeam === 0 ? sfx.win() : sfx.lose();
      return;
    }
    if (last?.type === "blocked") sfx.block();
    else if (last?.type === "domino") {
      teamOfSeat(last.seat, state.players) === 0 ? sfx.win() : sfx.lose();
    }
  }, [state.phase, state.handNumber]);

  return (
    <main className="mx-auto w-full max-w-6xl px-3 py-5 sm:px-6">
      <AppNav />

      <header className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl font-extrabold sm:text-3xl">
            <span className="gold-text">Domino</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            {preset.label} · a {state.targetScore} · mano {state.handNumber}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-4 rounded-2xl glass-panel px-4 py-2">
          <Score label="Nosotros" value={state.scores[0]} tone="a" />
          <div className="h-8 w-px bg-border" />
          <Score label="Ellos" value={state.scores[1]} tone="b" />
        </div>
      </header>

      <GameTable
        state={state}
        mySeat={0}
        seats={seats}
        themeId={themeId}
        tileSkin={tileSkin}
        tableFlag={tableFlag}
        thinkingSeat={thinking}
        myLevel={progress.level}
        bubbles={bubbles}
        onSay={say}
        onPlay={handlePlay}
        onPass={handlePass}
      />

      {state.phase !== "playing" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-sm animate-scale-in rounded-3xl p-6 text-center">
            <h2 className="font-display text-2xl font-bold">
              {state.phase === "game_over"
                ? state.winnerTeam === 0
                  ? "¡Ganamos la partida!"
                  : "Ganaron ellos"
                : last?.type === "domino"
                  ? "¡Dominó!"
                  : "Tranque"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {last && "points" in last ? `${last.points} puntos a la cuenta.` : ""}
            </p>
            <p className="mt-3 text-lg font-semibold">
              {state.scores[0]} — {state.scores[1]}
            </p>
            <button
              onClick={() => {
                sfx.click();
                setState((cur) =>
                  cur.phase === "game_over"
                    ? createGame({ targetScore: cur.targetScore, variant: cur.variant })
                    : nextHand(cur),
                );
              }}
              className="mt-5 w-full rounded-full bg-primary py-2.5 font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
            >
              {state.phase === "game_over" ? "Partida nueva" : "Siguiente mano"}
            </button>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-destructive px-5 py-2 text-sm font-medium text-destructive-foreground shadow-lg">
          {toast}
        </div>
      ) : null}
    </main>
  );
}

function Score({ label, value, tone }: { label: string; value: number; tone: "a" | "b" }) {
  return (
    <div className="text-center">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p
        className={cn(
          "font-display text-2xl font-bold",
          tone === "a" ? "text-team-a" : "text-team-b",
        )}
      >
        {value}
      </p>
    </div>
  );
}

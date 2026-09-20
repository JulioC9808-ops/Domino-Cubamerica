import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus, Users } from "lucide-react";
import { AppNav } from "@/components/AppNav";
import { SoundToggle } from "@/components/SoundToggle";
import { GameTable, type SeatInfo } from "@/components/domino/GameTable";
import { CreateRoomModal } from "@/components/domino/CreateRoomModal";
import { chooseBotMove } from "@/lib/domino/bot";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import type { ChatBubble } from "@/lib/domino/chat";
import {
  type GameState,
  type Side,
  type Tile,
  type Variant,
  VARIANTS,
  createGame,
  nextHand,
  teamOfSeat,
  passTurn,
  playTile,
} from "@/lib/domino/engine";
import { cn } from "@/lib/utils";
import { initSfx, sfx } from "@/lib/sfx";

type Search = {
  v?: string;
  pts?: number;
  sala?: string;
};

export const Route = createFileRoute("/jugar")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): Search => {
    const rawPts = Number(s["pts"]);
    const pts = !isNaN(rawPts) && rawPts >= 100 && rawPts <= 400 ? rawPts : 150;
    return {
      v: typeof s["v"] === "string" ? (s["v"] as string) : "pairs-6",
      pts,
      sala: typeof s["sala"] === "string" ? (s["sala"] as string) : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Jugar dominó — mesa contra la máquina y amigos | Domino" },
      {
        name: "description",
        content:
          "Juega dominó cubano contra bots: doble 6 o doble 9, en pareja o 1 vs 1, con mesa animada y chat rápido.",
      },
      { property: "og:title", content: "Jugar dominó cubano" },
      {
        property: "og:description",
        content: "Mesa de dominó doble 6 o doble 9 contra la máquina.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Jugar,
});

const BOT_NAMES = ["Yuniel", "Marisol", "El Chino"];
const BOT_FLAGS = ["es", "mx", "do"];

function Jugar() {
  const { v, pts = 150, sala } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, progress } = useProfile(user?.id);

  const preset = VARIANTS.find((x) => x.id === v) ?? VARIANTS[0]!;
  const [targetScore, setTargetScore] = useState<number>(() =>
    Math.max(100, Math.min(400, Number(pts) || 150)),
  );
  const [state, setState] = useState<GameState>(() =>
    createGame({
      targetScore: Math.max(100, Math.min(400, Number(pts) || 150)),
      variant: preset.variant,
    }),
  );
  const [thinking, setThinking] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [bubbles, setBubbles] = useState<ChatBubble[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    initSfx();
  }, []);

  useEffect(() => {
    const validPts = Math.max(100, Math.min(400, Number(pts) || 150));
    setTargetScore(validPts);
    setState(createGame({ targetScore: validPts, variant: preset.variant }));
    sfx.deal();
  }, [preset.id, preset.variant, pts]);

  const themeId = profile?.table_theme ?? "madera";
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

  /* ── Continuar a la siguiente mano ── */
  function handleContinue() {
    sfx.click();
    setState((cur) =>
      cur.phase === "game_over"
        ? createGame({ targetScore: cur.targetScore, variant: cur.variant })
        : nextHand(cur),
    );
  }

  function handleRoomCreated(code: string, newTargetScore: number, newVariant: Variant) {
    const variantKey = `${newVariant.mode}-${newVariant.maxPip}`;
    void navigate({
      to: "/jugar",
      search: { v: variantKey, pts: newTargetScore, sala: code },
    });
    setTargetScore(newTargetScore);
    setState(createGame({ targetScore: newTargetScore, variant: newVariant }));
    setShowCreateModal(false);
  }

  const last = state.events[state.events.length - 1];
  useEffect(() => {
    if (state.phase === "playing") return;
    if (state.phase === "game_over") {
      if (state.winnerTeam === 0) {
        sfx.win();
      } else {
        sfx.lose();
      }
      return;
    }
    if (last?.type === "blocked") sfx.block();
    else if (last?.type === "domino") {
      if (teamOfSeat(last.seat, state.players) === 0) {
        sfx.win();
      } else {
        sfx.lose();
      }
    }
  }, [state.phase, state.handNumber]);

  return (
    <main className="mx-auto w-full max-w-6xl px-3 py-5 sm:px-6">
      <AppNav />
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate font-display text-2xl font-extrabold sm:text-3xl">
              <span className="gold-text">Domino</span>
            </h1>
            {sala && (
              <span className="rounded-full bg-gold/20 px-2.5 py-0.5 text-xs font-mono font-bold text-gold">
                Sala {sala}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <span>{preset.label}</span>
            <span>·</span>
            <div className="flex items-center gap-1.5">
              <span>Meta:</span>
              <select
                value={targetScore}
                onChange={(e) => {
                  const newPts = Number(e.target.value);
                  setTargetScore(newPts);
                  setState((cur) => ({ ...cur, targetScore: newPts }));
                }}
                className="rounded-lg border border-border bg-card px-2 py-0.5 text-xs font-bold text-gold focus:border-gold focus:outline-none"
              >
                <option value={100}>100 pts</option>
                <option value={150}>150 pts</option>
                <option value={200}>200 pts</option>
                <option value={250}>250 pts</option>
                <option value={300}>300 pts</option>
                <option value={400}>400 pts</option>
              </select>
            </div>
            <span>·</span>
            <span>Mano {state.handNumber}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 rounded-2xl border border-gold/40 bg-gold/10 hover:bg-gold/20 px-3.5 py-2 text-xs font-bold text-gold transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Crear Sala</span>
          </button>

          <div className="flex shrink-0 items-center gap-3 rounded-2xl glass-panel px-3.5 py-2 border border-border/80">
            <Score label="Nosotros" value={state.scores[0]} tone="a" />
            <div className="h-8 w-px bg-border" />
            <Score label="Ellos" value={state.scores[1]} tone="b" />
            <div className="h-8 w-px bg-border" />
            <SoundToggle id="game-sound-toggle" size="sm" />
          </div>
        </div>
      </header>

      {!user ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold/30 bg-card/60 px-4 py-2.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-foreground">
              <strong className="text-gold">Mesa de Dominó:</strong> Límite de {targetScore} puntos
              (100 a 400 pts). Puedes invitar amigos compartiendo tu enlace.
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1 rounded-full bg-primary px-3.5 py-1 text-xs font-semibold text-primary-foreground transition-transform hover:scale-105"
            >
              <Users className="h-3.5 w-3.5" />
              Crear sala para amigos
            </button>
          </div>
        </div>
      ) : null}

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
              onClick={() => handleContinue()}
              className="mt-5 w-full rounded-full bg-primary py-2.5 font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
            >
              {state.phase === "game_over" ? "Partida nueva" : "Siguiente mano"}
            </button>
          </div>
        </div>
      ) : null}

      {/* Modal para Crear Sala y Enviar Enlaces a Amigos con límite de 100 a 400 pts */}
      <CreateRoomModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onRoomCreated={handleRoomCreated}
      />

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

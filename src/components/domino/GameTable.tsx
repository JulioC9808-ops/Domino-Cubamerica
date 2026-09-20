import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { DominoTile } from "./DominoTile";
import { BoardSnake } from "./BoardSnake";
import { QuickChat } from "./QuickChat";
import { getTheme } from "@/lib/domino/themes";
import { Flag } from "@/components/Flag";
import { sfx } from "@/lib/sfx";
import { getSkin, FRAME_RING } from "@/lib/domino/levels";
import type { ChatBubble } from "@/lib/domino/chat";
import {
  type GameState,
  type Side,
  type Tile,
  canPlaceTile,
  hasLegalMove,
  tileKey,
  teamOfSeat,
} from "@/lib/domino/engine";

export type SeatInfo = {
  name: string;
  flag: string;
  isBot?: boolean;
  connected?: boolean;
  level?: number;
  frame?: string;
  title?: string;
};

type Props = {
  state: GameState;
  mySeat: number;
  seats: SeatInfo[];
  themeId?: string;
  tileSkin?: string;
  tableFlag?: string;
  thinkingSeat?: number | null;
  myLevel?: number;
  bubbles?: ChatBubble[];
  onSay?: (text: string, emoji: string) => void;
  onPlay: (tile: Tile, side: Side) => void;
  onPass: () => void;
};

export function GameTable({
  state,
  mySeat,
  seats,
  themeId,
  tileSkin,
  tableFlag,
  thinkingSeat,
  myLevel = 1,
  bubbles = [],
  onSay,
  onPlay,
  onPass,
}: Props) {
  const theme = getTheme(themeId);
  const skin = getSkin(tileSkin);
  const [selected, setSelected] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ key: string; x: number; y: number } | null>(null);
  const pressRef = useRef<{ key: string; x: number; y: number } | null>(null);
  const movedRef = useRef(false);
  const tableRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const handRef = useRef<HTMLDivElement>(null);
  const players = state.players;
  const myTurn = state.turn === mySeat && state.phase === "playing";
  const rawHand = state.hands[mySeat];
  const hand = useMemo(() => rawHand ?? [], [rawHand]);

  useEffect(() => {
    if (!myTurn) setSelected(null);
  }, [myTurn]);

  const activeKey = selected ?? drag?.key ?? null;
  const activeTile = useMemo(
    () => (activeKey ? (hand.find((t) => tileKey(t) === activeKey) ?? null) : null),
    [hand, activeKey],
  );
  const placement = activeTile ? canPlaceTile(state, activeTile) : { left: false, right: false };
  const empty = state.board.length === 0;
  const mustPass = myTurn && !hasLegalMove(state, mySeat);
  const startKey = useMemo(() => {
    const first = state.events.find((e) => e.type === "play");
    return first && first.type === "play" ? tileKey(first.tile) : undefined;
  }, [state.events]);

  function attempt(tile: Tile, side: Side) {
    sfx.place();
    onPlay(tile, side);
    setSelected(null);
    setDrag(null);
  }

  function tapTile(tile: Tile) {
    if (!myTurn) return;
    const c = canPlaceTile(state, tile);
    if (empty) return attempt(tile, "right");
    if (c.left && c.right) {
      // ambos lados: se selecciona; se coloca arrastrándola o tocando la punta
      setSelected((s) => (s === tileKey(tile) ? null : tileKey(tile)));
      return;
    }
    // un solo lado: tocarla la coloca directo
    if (c.left) return attempt(tile, "left");
    if (c.right) return attempt(tile, "right");
  }

  // ---- arrastre fluido (pointer events, funciona con mouse y touch) ----
  function handleTilePointerDown(e: React.PointerEvent, tile: Tile) {
    if (!myTurn) return;
    const c = canPlaceTile(state, tile);
    if (!(empty || c.left || c.right)) return;
    pressRef.current = { key: tileKey(tile), x: e.clientX, y: e.clientY };
    movedRef.current = false;
  }

  useEffect(() => {
    function onMove(e: PointerEvent) {
      const p = pressRef.current;
      if (!p) return;
      if (!movedRef.current && Math.hypot(e.clientX - p.x, e.clientY - p.y) > 6) {
        movedRef.current = true;
      }
      if (movedRef.current) setDrag({ key: p.key, x: e.clientX, y: e.clientY });
    }
    function onCancel() {
      pressRef.current = null;
      movedRef.current = false;
      setDrag(null);
    }
    function onUp(e: PointerEvent) {
      const p = pressRef.current;
      pressRef.current = null;
      if (!p) return;
      if (movedRef.current) {
        setDrag(null);
        const tile = state.hands[mySeat]?.find((t) => tileKey(t) === p.key);
        if (!tile) return;
        const c = canPlaceTile(state, tile);
        const playable = empty || c.left || c.right;
        if (!playable) return;

        // Verificar si fue soltada sobre la mesa o fuera de la mano
        const tableEl = tableRef.current;
        const handEl = handRef.current;
        const tableRect = tableEl?.getBoundingClientRect();
        const handRect = handEl?.getBoundingClientRect();

        const el = document.elementFromPoint(e.clientX, e.clientY);
        const zone = el?.closest?.("[data-drop-side]") as HTMLElement | null | undefined;
        const directSide = zone?.dataset?.dropSide as Side | undefined;

        // Se considera arrastrada a la mesa si cayó sobre la mesa o por encima de la mano
        const droppedOnTable =
          Boolean(directSide) ||
          (tableRect &&
            e.clientX >= tableRect.left - 40 &&
            e.clientX <= tableRect.right + 40 &&
            e.clientY >= tableRect.top - 40 &&
            e.clientY < (handRect ? handRect.top + 20 : tableRect.bottom - 60));

        if (!droppedOnTable) return;

        // 1. Si cayó directo sobre una ficha extrema del tablero con data-drop-side
        if (directSide) {
          const sideOk = empty ? true : directSide === "left" ? c.left : c.right;
          if (sideOk) {
            attempt(tile, empty ? "right" : directSide);
            return;
          }
        }

        // 2. Si la mesa está vacía (primera ficha de la mano)
        if (empty) {
          attempt(tile, "right");
          return;
        }

        // 3. Si la ficha solo puede entrar por un único extremo
        if (c.left && !c.right) {
          attempt(tile, "left");
          return;
        }
        if (!c.left && c.right) {
          attempt(tile, "right");
          return;
        }

        // 4. Si la ficha puede entrar por AMBOS extremos:
        // Determinar según la mitad izquierda o derecha de la mesa/tablero
        if (c.left && c.right) {
          const boardEl = boardRef.current ?? tableEl;
          const rect = boardEl ? boardEl.getBoundingClientRect() : tableRect!;
          const centerX = rect.left + rect.width / 2;
          const chosenSide: Side = e.clientX < centerX ? "left" : "right";
          attempt(tile, chosenSide);
          return;
        }
        return;
      }
      // tap (sin arrastre)
      const tile = state.hands[mySeat]?.find((t) => tileKey(t) === p.key);
      if (tile) tapTile(tile);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, mySeat, empty]);

  const topSeat = players === 2 ? (mySeat + 1) % 2 : (mySeat + 2) % 4;

  return (
    <div
      className={cn("relative w-full", tileSkin === "colores" && "skin-pipcolor")}
      style={
        {
          "--felt": theme.felt,
          "--felt-deep": theme.feltDeep,
          "--rail": theme.rail,
          "--gold": theme.accent,
          "--bone": skin.bone,
          "--bone-edge": skin.boneEdge,
          "--pip": skin.pip,
          "--bone-texture": skin.texture ?? "none",
        } as React.CSSProperties
      }
    >
      <div
        ref={tableRef}
        className="felt-surface rail-edge relative overflow-hidden rounded-[2rem]"
      >
        {/* Bandera PURA visible solo para quien la activó + textura del tema encima */}
        {tableFlag ? (
          <div className="pointer-events-none absolute inset-0 z-0">
            <Flag code={tableFlag} fill />
            <div
              className="absolute inset-0 opacity-[0.10]"
              style={{ background: theme.texture }}
            />
          </div>
        ) : (
          <div
            className="pointer-events-none absolute inset-0 z-0 opacity-[0.18]"
            style={{ background: theme.texture }}
          />
        )}

        <div className="relative z-10 grid min-h-[62vh] grid-rows-[auto_1fr_auto] gap-2 p-3 sm:min-h-[68vh] sm:p-5">
          <div className="flex justify-center">
            <OpponentRow
              seat={topSeat}
              state={state}
              seats={seats}
              mySeat={mySeat}
              thinkingSeat={thinkingSeat}
              layout="top"
            />
          </div>

          <div
            className={cn(
              "grid items-center gap-1 sm:gap-3",
              players === 4 ? "grid-cols-[auto_1fr_auto]" : "grid-cols-1",
            )}
          >
            {players === 4 ? (
              <OpponentRow
                seat={(mySeat + 3) % 4}
                state={state}
                seats={seats}
                mySeat={mySeat}
                thinkingSeat={thinkingSeat}
                layout="left"
              />
            ) : null}

            <div ref={boardRef} className="relative min-w-0">
              <BoardSnake
                board={state.board}
                players={players}
                startKey={startKey}
                emptyMessage={
                  myTurn
                    ? "Arrastra o toca una ficha para salir"
                    : `Sale ${seats[state.turn]?.name ?? "…"}`
                }
                showZones={!!activeTile}
                leftEnabled={placement.left}
                rightEnabled={placement.right}
                onDropSide={(side) => activeTile && attempt(activeTile, side)}
              />
              {!empty ? (
                <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between px-3 text-[10px] font-semibold uppercase tracking-widest text-white/45">
                  <span>punta {state.leftEnd}</span>
                  <span>punta {state.rightEnd}</span>
                </div>
              ) : null}
            </div>

            {players === 4 ? (
              <OpponentRow
                seat={(mySeat + 1) % 4}
                state={state}
                seats={seats}
                mySeat={mySeat}
                thinkingSeat={thinkingSeat}
                layout="right"
              />
            ) : null}
          </div>

          <div className="flex flex-col items-center gap-2">
            <SeatBadge
              seat={mySeat}
              players={players}
              info={seats[mySeat]}
              active={myTurn}
              count={hand.length}
              me
            />
            <div
              ref={handRef}
              className="no-scrollbar flex w-full items-end justify-start gap-1.5 overflow-x-auto px-1 pb-1 sm:justify-center sm:gap-2"
            >
              {hand.map((tile, i) => {
                const c = canPlaceTile(state, tile);
                const playable = myTurn && (empty || c.left || c.right);
                const isDraggingThis = drag?.key === tileKey(tile);
                return (
                  <div
                    key={tileKey(tile)}
                    className={cn(
                      "animate-deal select-none",
                      playable && "touch-none cursor-grab active:cursor-grabbing",
                      isDraggingThis && "opacity-25 scale-95",
                    )}
                    style={{ animationDelay: `${i * 40}ms` }}
                    onPointerDown={(e) => handleTilePointerDown(e, tile)}
                  >
                    <DominoTile
                      tile={tile}
                      orientation="v"
                      size={hand.length > 10 ? "sm" : "md"}
                      playable={playable}
                      dimmed={myTurn && !playable}
                      selected={selected === tileKey(tile)}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex w-full items-end justify-between gap-2">
              {onSay ? <QuickChat level={myLevel} bubbles={bubbles} onSend={onSay} /> : <span />}
              {mustPass ? (
                <button
                  onClick={() => {
                    sfx.pass();
                    onPass();
                  }}
                  className="animate-glow-pulse rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
                >
                  Pasar — no tienes jugada
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* fantasma de la ficha mientras se arrastra */}
      {drag
        ? (() => {
            const t = hand.find((x) => tileKey(x) === drag.key);
            return t ? (
              <div
                className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-[70%]"
                style={{ left: drag.x, top: drag.y }}
              >
                <div className="rotate-[-5deg] scale-110 drop-shadow-[0_18px_24px_oklch(0_0_0/0.5)]">
                  <DominoTile tile={t} orientation="v" size="md" />
                </div>
              </div>
            ) : null;
          })()
        : null}
    </div>
  );
}

function OpponentRow({
  seat,
  state,
  seats,
  mySeat,
  thinkingSeat,
  layout,
}: {
  seat: number;
  state: GameState;
  seats: SeatInfo[];
  mySeat: number;
  thinkingSeat?: number | null | undefined;
  layout: "top" | "left" | "right";
}) {
  const count = state.hands[seat]?.length ?? 0;
  const active = state.turn === seat && state.phase === "playing";
  const vertical = layout !== "top";
  const partner = state.players === 4 && (seat - mySeat + 4) % 4 === 2;
  return (
    <div
      className={cn(
        "flex items-center gap-2",
        vertical ? "w-auto min-w-[3.5rem] max-w-[8rem] flex-col sm:min-w-[4.5rem]" : "flex-col",
      )}
    >
      <SeatBadge
        seat={seat}
        players={state.players}
        info={seats[seat]}
        active={active}
        count={count}
        thinking={thinkingSeat === seat}
        compact={vertical}
        partner={partner}
      />
      <div className={cn("flex", vertical ? "flex-col -space-y-3" : "-space-x-3")}>
        {Array.from({ length: count }).map((_, i) => (
          <DominoTile
            key={i}
            faceDown
            size="xs"
            orientation={vertical ? "h" : "v"}
            style={{ zIndex: i }}
          />
        ))}
      </div>
    </div>
  );
}

function SeatBadge({
  seat,
  players,
  info,
  active,
  count,
  me,
  compact,
  thinking,
  partner,
}: {
  seat: number;
  players: number;
  info?: SeatInfo | undefined;
  active?: boolean | undefined;
  count: number;
  me?: boolean | undefined;
  compact?: boolean | undefined;
  thinking?: boolean | undefined;
  partner?: boolean | undefined;
}) {
  const team = teamOfSeat(seat, players);
  return (
    <div
      className={cn(
        "inline-flex w-auto max-w-none items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur transition-all",
        team === 0 ? "bg-team-a/15 text-team-a" : "bg-team-b/15 text-team-b",
        active && "ring-2 ring-gold shadow-[0_0_18px_-4px_var(--gold)]",
        compact && "flex-col gap-1 px-2 py-1 text-[11px]",
      )}
      style={{ border: FRAME_RING[info?.frame ?? "none"] }}
    >
      <div className="flex shrink-0 items-center justify-center">
        <Flag code={info?.flag} size={compact ? 16 : 20} />
      </div>
      <span className="whitespace-nowrap font-medium leading-none">
        {info?.name ?? "Libre"}
        {partner ? " · pareja" : ""}
      </span>
      {info?.level ? <span className="shrink-0 opacity-70">n{info.level}</span> : null}
      {!me ? (
        <span className="shrink-0 rounded-full bg-black/25 px-1.5 py-0.5 text-[10px] font-bold text-white/90">
          {count}
        </span>
      ) : null}
      {thinking ? <span className="shrink-0 animate-pulse text-gold">•••</span> : null}
      {info && info.connected === false ? (
        <span className="shrink-0 text-destructive">⚠</span>
      ) : null}
    </div>
  );
}

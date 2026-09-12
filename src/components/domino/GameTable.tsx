import { useEffect, useMemo, useState } from "react";
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
  const [dragging, setDragging] = useState<string | null>(null);

  const players = state.players;
  const myTurn = state.turn === mySeat && state.phase === "playing";
  const hand = state.hands[mySeat] ?? [];

  useEffect(() => {
    if (!myTurn) setSelected(null);
  }, [myTurn]);

  const active = selected ?? dragging;
  const activeTile = useMemo(
    () => hand.find((t) => tileKey(t) === active) ?? null,
    [hand, active],
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
    setDragging(null);
  }

  function tapTile(tile: Tile) {
    if (!myTurn) return;
    const c = canPlaceTile(state, tile);
    if (empty) return attempt(tile, "right");
    if (c.left && c.right) {
      setSelected((s) => (s === tileKey(tile) ? null : tileKey(tile)));
      return;
    }
    if (c.left) return attempt(tile, "left");
    if (c.right) return attempt(tile, "right");
  }

  const topSeat = players === 2 ? (mySeat + 1) % 2 : (mySeat + 2) % 4;

  return (
    <div
      className="relative w-full"
      style={
        {
          "--felt": theme.felt,
          "--felt-deep": theme.feltDeep,
          "--rail": theme.rail,
          "--gold": theme.accent,
          "--bone": skin.bone,
          "--bone-edge": skin.boneEdge,
          "--pip": skin.pip,
        } as React.CSSProperties
      }
    >
      <div
        className={cn(
          "felt-surface rail-edge relative overflow-hidden rounded-[2rem]",
          theme.wood && "wood-grain",
        )}
      >
        {/* Marca de agua local: solo la ve quien la activó en sus ajustes */}
        {tableFlag ? (
          <div className="pointer-events-none absolute inset-0 z-0">
            <Flag code={tableFlag} fill className="opacity-[0.14] blur-[1px] saturate-150" />
            <div className="absolute inset-0 bg-[color-mix(in_oklab,var(--felt)_55%,transparent)]" />
          </div>
        ) : null}

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

            <div className="relative min-w-0">
              <BoardSnake
                board={state.board}
                players={players}
                startKey={startKey}
                emptyMessage={
                  myTurn
                    ? "Sales tú — arrastra o toca una ficha"
                    : `Sale ${seats[state.turn]?.name ?? "…"}`
                }
                showZones={!!activeTile && !empty}
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
            <div className="no-scrollbar flex w-full items-end justify-start gap-1.5 overflow-x-auto px-1 pb-1 sm:justify-center sm:gap-2">
              {hand.map((tile, i) => {
                const c = canPlaceTile(state, tile);
                const playable = myTurn && (empty || c.left || c.right);
                return (
                  <div
                    key={tileKey(tile)}
                    className="animate-deal"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <DominoTile
                      tile={tile}
                      orientation="v"
                      size={hand.length > 10 ? "sm" : "md"}
                      playable={playable}
                      dimmed={myTurn && !playable}
                      selected={selected === tileKey(tile)}
                      onClick={() => tapTile(tile)}
                      draggable={playable}
                      onDragStart={(e) => {
                        setDragging(tileKey(tile));
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", tileKey(tile));
                      }}
                      onDragEnd={() => setDragging(null)}
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex w-full items-end justify-between gap-2">
              {onSay ? (
                <QuickChat level={myLevel} bubbles={bubbles} onSend={onSay} />
              ) : (
                <span />
              )}
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
    <div className={cn("flex items-center gap-2", vertical ? "w-14 flex-col sm:w-20" : "flex-col")}>
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
        "flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur transition-all",
        team === 0 ? "bg-team-a/15 text-team-a" : "bg-team-b/15 text-team-b",
        active && "ring-2 ring-gold shadow-[0_0_18px_-4px_var(--gold)]",
        compact && "flex-col gap-0.5 px-1.5 text-[10px]",
      )}
      style={{ border: FRAME_RING[info?.frame ?? "none"] }}
    >
      <Flag code={info?.flag} size={compact ? 14 : 18} />
      <span className={cn("max-w-[8rem] truncate", compact && "max-w-[4rem]")}>
        {info?.name ?? "Libre"}
        {partner ? " · pareja" : ""}
      </span>
      {info?.level ? <span className="opacity-70">n{info.level}</span> : null}
      {!me ? <span className="opacity-70">{count}</span> : null}
      {thinking ? <span className="animate-pulse text-gold">•••</span> : null}
      {info && info.connected === false ? <span className="text-destructive">⚠</span> : null}
    </div>
  );
}

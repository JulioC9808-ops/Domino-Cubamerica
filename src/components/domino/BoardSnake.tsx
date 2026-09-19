import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { DominoTile } from "./DominoTile";
import { type BoardTile, type Side, type Tile, teamOfSeat } from "@/lib/domino/engine";

/**
 * Tablero serpiente:
 * - La cadena nace en el CENTRO y crece en horizontal hacia ambos extremos.
 * - Los dobles van PERPENDICULARES a la línea de juego.
 * - Al llegar al borde, la rama dobla con una ficha perpendicular y sigue en
 *   una fila nueva en zigzag: la derecha baja y la izquierda sube (en espejo).
 * - Entre filas hay una separación fija (ROW_GAP): las fichas NUNCA se
 *   superponen, ni al doblar hacia arriba ni hacia abajo.
 * - El jugador solo elige la punta (izq/der); el reparto de filas es automático.
 */
const U = 26; // media ficha (ficha sm = 52×26)
const ROW_GAP = 12; // separación visible entre filas (súbela a 16 si la quieres más aire)
const ROW_STEP = 2 * U + ROW_GAP; // distancia entre líneas centrales de filas
const LONG = 52;

type Dir = "E" | "W";
type Branch = "L" | "R";

type Placed = {
  bt: BoardTile;
  /** px relativos al centro */
  left: number;
  top: number;
  vertical: boolean;
  /** vertical: true = el valor que conecta va ABAJO (rama izquierda) */
  reversedV: boolean;
  /** horizontal: true = el valor que conecta va a la DERECHA */
  reversed: boolean;
};

function growBranch(
  branch: Branch,
  board: BoardTile[],
  indices: number[],
  initCx: number,
  maxX: number,
  minX: number,
  placed: Placed[],
) {
  let cx = initCx;
  let cy = 0;
  let dir: Dir = branch === "R" ? "E" : "W";
  const going = branch === "R" ? 1 : -1; // derecha baja, izquierda sube

  for (const i of indices) {
    const bt = board[i]!;
    const isDouble = bt.tile.a === bt.tile.b;

    if (isDouble) {
      // doble perpendicular a la línea de juego
      const px = dir === "E" ? cx : cx - U;
      placed.push({
        bt,
        left: px,
        top: cy - U,
        vertical: true,
        reversedV: branch === "L",
        reversed: false,
      });
      cx = dir === "E" ? cx + U : cx - U;
      continue;
    }

    const fits = dir === "E" ? cx + 2 * U <= maxX : cx - 2 * U >= minX;
    if (fits) {
      const px = dir === "E" ? cx : cx - 2 * U;
      placed.push({
        bt,
        left: px,
        top: cy - U / 2,
        vertical: false,
        reversedV: false,
        reversed: dir === "W", // el valor que conecta mira hacia la cadena (centro)
      });
      cx = dir === "E" ? cx + 2 * U : cx - 2 * U;
    } else {
      // esquina: ficha perpendicular que dobla a la fila siguiente (zigzag)
      const px = Math.max(minX, Math.min(maxX - U, dir === "E" ? cx : cx - U));
      placed.push({
        bt,
        left: px,
        top: cy - U,
        vertical: true,
        reversedV: branch === "L",
        reversed: false,
      });
      dir = dir === "E" ? "W" : "E";
      cy += going * ROW_STEP;
    }
  }
}

export function BoardSnake({
  board,
  players,
  startKey,
  emptyMessage,
  leftEnabled,
  rightEnabled,
  showZones,
  onDropSide,
}: {
  board: BoardTile[];
  players: number;
  startKey?: string | undefined;
  emptyMessage: string;
  leftEnabled: boolean;
  rightEnabled: boolean;
  showZones: boolean;
  onDropSide: (side: Side) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const cols = useMemo(() => {
    const usable = Math.max(6 * U, width - 104); // margen para las zonas de drop
    return Math.max(6, Math.floor(usable / U));
  }, [width]);

  const layout = useMemo(() => {
    const empty = { placed: [] as Placed[], w: 0, h: 0, offX: 0, offY: 0 };
    if (board.length === 0) return empty;

    const half = Math.floor(cols / 2) * U;
    const minX = -half;
    const maxX = half;

    let startIdx = startKey ? board.findIndex((b) => b.key === startKey) : 0;
    if (startIdx < 0) startIdx = 0;
    const first = board[startIdx]!;
    const firstDouble = first.tile.a === first.tile.b;

    const placed: Placed[] = [];
    // primera ficha centrada: doble en perpendicular, normal tumbada
    if (firstDouble) {
      placed.push({ bt: first, left: -U / 2, top: -U, vertical: true, reversedV: false, reversed: false });
    } else {
      placed.push({ bt: first, left: -U, top: -U / 2, vertical: false, reversedV: false, reversed: false });
    }

    const idxR: number[] = [];
    for (let i = startIdx + 1; i < board.length; i++) idxR.push(i);
    const idxL: number[] = [];
    for (let i = startIdx - 1; i >= 0; i--) idxL.push(i);

    growBranch("R", board, idxR, firstDouble ? U / 2 : U, maxX, minX, placed);
    growBranch("L", board, idxL, firstDouble ? -U / 2 : -U, maxX, minX, placed);

    let minTop = Infinity;
    let maxBottom = -Infinity;
    for (const p of placed) {
      const h = p.vertical ? 2 * U : U;
      minTop = Math.min(minTop, p.top);
      maxBottom = Math.max(maxBottom, p.top + h);
    }

    return {
      placed,
      w: 2 * half,
      h: Math.max(1, maxBottom - minTop),
      offX: half,
      offY: -minTop,
    };
  }, [board, cols, startKey]);

  return (
    <div ref={ref} className="relative min-h-[26vh] w-full px-12 py-3">
      {showZones ? (
        <>
          <SideZone side="left" enabled={leftEnabled} onDrop={() => onDropSide("left")} />
          <SideZone side="right" enabled={rightEnabled} onDrop={() => onDropSide("right")} />
        </>
      ) : null}
      {board.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-white/55">{emptyMessage}</p>
      ) : (
        <div className="no-scrollbar max-h-[42vh] overflow-y-auto">
          <div
            className="relative mx-auto"
            style={{ width: Math.max(LONG, layout.w), height: Math.max(LONG, layout.h) }}
          >
            {layout.placed.map((p, i) => {
              const t = p.bt;
              const shown: Tile = p.vertical
                ? p.reversedV
                  ? ({ a: t.right, b: t.left } as Tile)
                  : ({ a: t.left, b: t.right } as Tile)
                : p.reversed
                  ? ({ a: t.right, b: t.left } as Tile)
                  : ({ a: t.left, b: t.right } as Tile);
              return (
                <div
                  key={`${t.key}-${i}`}
                  className="animate-tile-drop absolute"
                  style={{ left: p.left + layout.offX, top: p.top + layout.offY }}
                >
                  <DominoTile
                    tile={shown}
                    orientation={p.vertical ? "v" : "h"}
                    size="sm"
                    className={cn(
                      teamOfSeat(t.playedBy, players) === 0 ? "ring-team-a/40" : "ring-team-b/40",
                    )}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function SideZone({
  side,
  enabled,
  onDrop,
}: {
  side: Side;
  enabled: boolean;
  onDrop: () => void;
}) {
  const [over, setOver] = useState(false);
  return (
    <button
      onClick={() => enabled && onDrop()}
      onDragOver={(e) => {
        if (!enabled) return;
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (enabled) onDrop();
      }}
      className={cn(
        "absolute inset-y-2 z-20 flex w-10 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed text-[10px] font-bold uppercase tracking-wider transition-all",
        side === "left" ? "left-1" : "right-1",
        enabled ? "border-gold/70 text-gold" : "cursor-not-allowed border-white/15 text-white/25",
        over && enabled && "scale-105 border-gold bg-gold/15",
      )}
      aria-label={side === "left" ? "Jugar por la izquierda" : "Jugar por la derecha"}
    >
      <span className="text-lg leading-none">{side === "left" ? "◀" : "▶"}</span>
      {side === "left" ? "Izq" : "Der"}
    </button>
  );
}

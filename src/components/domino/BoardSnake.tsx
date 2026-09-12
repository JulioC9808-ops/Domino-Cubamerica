import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { DominoTile } from "./DominoTile";
import { type BoardTile, type Side, type Tile, teamOfSeat } from "@/lib/domino/engine";

/**
 * Tablero serpiente/tren real: la cadena crece desde la primera ficha hacia
 * los dos extremos. Las fichas quedan SIEMPRE pegadas (rejilla de medias
 * fichas) y al llegar al borde doblan: el extremo derecho baja y el izquierdo
 * sube, para que las dos ramas nunca se pisen.
 */

const U = 26; // media ficha (ficha sm = 52 x 26)
const LONG = 52;
/** separación vertical entre filas de la serpiente para que no se superpongan */
const ROW_GAP = 14;

type Dir = "E" | "W";

type Placed = {
  bt: BoardTile;
  /** celda superior-izquierda */
  x: number;
  y: number;
  vertical: boolean;
  /** para tumbadas: si el valor "left" mira al este */
  reversed: boolean;
};

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
    const placed: Placed[] = [];
    if (board.length === 0) return { placed, w: 0, h: 0 };

    const half = Math.floor(cols / 2);
    const maxX = half; // límite este (en celdas, relativo al centro)
    const minX = -half; // límite oeste

    let startIdx = startKey ? board.findIndex((b) => b.key === startKey) : 0;
    if (startIdx < 0) startIdx = 0;

    const first = board[startIdx]!;
    const firstDouble = first.tile.a === first.tile.b;
    placed.push({
      bt: first,
      x: 0,
      y: 0,
      vertical: firstDouble,
      reversed: false,
    });

    // ---- rama derecha (índices startIdx+1 .. fin) ----
    {
      let dir: Dir = "E";
      let x = firstDouble ? 1 : 2; // primera celda libre al este
      let y = 0;
      for (let i = startIdx + 1; i < board.length; i++) {
        const bt = board[i]!;
        const isDouble = bt.tile.a === bt.tile.b;
        const width2 = isDouble ? 1 : 2;
        const fits = dir === "E" ? x + width2 - 1 <= maxX : x - width2 + 1 >= minX;
        if (!fits) {
          // ficha de esquina: parada, dobla hacia ABAJO
          placed.push({ bt, x, y, vertical: true, reversed: false });
          y += 1;
          if (dir === "E") {
            dir = "W";
            x = x - 1;
          } else {
            dir = "E";
            x = x + 1;
          }
          continue;
        }

        const px = dir === "E" ? x : x - width2 + 1;
        placed.push({
          bt,
          x: px,
          y: isDouble ? y - 0.5 : y,
          vertical: isDouble,
          reversed: dir === "W",
        });
        x = dir === "E" ? x + width2 : x - width2;
      }
    }

    // ---- rama izquierda (índices startIdx-1 .. 0) ----
    {
      let dir: Dir = "W";
      let x = firstDouble ? -1 : -1; // celda libre al oeste
      let y = 0;
      for (let i = startIdx - 1; i >= 0; i--) {
        const bt = board[i]!;
        const isDouble = bt.tile.a === bt.tile.b;
        const width2 = isDouble ? 1 : 2;
        const fits = dir === "W" ? x - width2 + 1 >= minX : x + width2 - 1 <= maxX;
        if (!fits) {
          // esquina: parada, dobla hacia ARRIBA
          placed.push({ bt, x, y: y - 1, vertical: true, reversed: false });
          y -= 1;
          if (dir === "W") {
            dir = "E";
            x = x + 1;
          } else {
            dir = "W";
            x = x - 1;
          }
          continue;
        }

        const px = dir === "W" ? x - width2 + 1 : x;
        placed.push({
          bt,
          x: px,
          y: isDouble ? y - 0.5 : y,
          vertical: isDouble,
          reversed: dir === "E",

        });
        x = dir === "W" ? x - width2 : x + width2;
      }
    }

    const xs = placed.map((p) => p.x);
    const xe = placed.map((p) => p.x + (p.vertical ? 1 : 2));
    const ys = placed.map((p) => p.y);
    const ye = placed.map((p) => p.y + (p.vertical ? 2 : 1));
    const minCx = Math.min(...xs);
    const minCy = Math.min(...ys);
    for (const p of placed) {
      p.x -= minCx;
      p.y -= minCy;
    }
    const rows = Math.max(1, Math.round(Math.max(...ye) - minCy));
    return {
      placed,
      w: (Math.max(...xe) - minCx) * U,
      h: (Math.max(...ye) - minCy) * U + (rows - 1) * ROW_GAP,
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
                ? t.tile
                : p.reversed
                  ? ({ a: t.right, b: t.left } as Tile)
                  : ({ a: t.left, b: t.right } as Tile);
              return (
                <div
                  key={`${t.key}-${i}`}
                  className="animate-tile-drop absolute"
                  style={{ left: p.x * U, top: p.y * U + Math.round(p.y) * ROW_GAP }}
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

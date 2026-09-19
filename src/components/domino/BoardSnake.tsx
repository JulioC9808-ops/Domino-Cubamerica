import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { DominoTile } from "./DominoTile";
import { type BoardTile, type Side, type Tile, teamOfSeat } from "@/lib/domino/engine";

/**
 * Tablero serpiente/tren real:
 * - La primera ficha queda fija en el CENTRO horizontal del tablero.
 * - La rama derecha crece al este y dobla hacia ABAJO en el borde;
 *   la izquierda crece al oeste y dobla hacia ARRIBA (en espejo): nunca se pisan.
 * - Tras la esquina, la rama sigue en vertical (VERTICAL_MIN fichas) y después
 *   el jugador elige en la zona de drop: seguir en vertical o volver hacia dentro.
 * - Rejilla de celdas U×U SIN huecos: una vertical ocupa exactamente 2 celdas,
 *   una horizontal 2×1 => las fichas nunca se superponen.
 */
const U = 26; // celda = media ficha (ficha sm = 52×26)
const LONG = 52;
/** fichas verticales obligatorias tras la esquina (la esquina cuenta como la 1ª) */
const VERTICAL_MIN = 2;

type Dir = "E" | "W";
type Branch = "L" | "R";
type Choice = "v" | "in"; // seguir vertical | volver hacia dentro
type Slot = "main" | Choice;

type Placed = {
  bt: BoardTile;
  x: number; // celda izquierda
  y: number; // celda superior (entero)
  vertical: boolean;
  reversed: boolean; // horizontal: el valor que conecta mira al este
};

type Cursor = {
  x: number;
  y: number;
  dir: Dir;
  mode: "h" | "v";
  vRun: number; // fichas verticales de la corrida actual (la esquina cuenta)
  turn: 1 | -1; // +1 dobla hacia abajo (derecha), -1 hacia arriba (izquierda)
};

type BranchEnd = { key: string; slots: Slot[] };

function growBranch(
  branch: Branch,
  board: BoardTile[],
  indices: number[],
  init: Cursor,
  maxX: number,
  minX: number,
  placed: Placed[],
  decisions: Map<string, Choice>,
): BranchEnd {
  let cur = init;
  let k = 0;
  for (const i of indices) {
    k += 1;
    const bt = board[i]!;
    const decKey = `${branch}:${k}`;
    if (cur.mode === "h") {
      const fits = cur.dir === "E" ? cur.x + 1 <= maxX : cur.x - 1 >= minX;
      if (fits) {
        const px = cur.dir === "E" ? cur.x : cur.x - 1;
        placed.push({
          bt,
          x: px,
          y: cur.y,
          vertical: false,
          reversed: branch === "R" ? cur.dir === "W" : cur.dir === "E",
        });
        cur = { ...cur, x: cur.dir === "E" ? cur.x + 2 : cur.x - 2 };
      } else {
        // esquina: la rama derecha baja, la izquierda sube
        const py = cur.turn === 1 ? cur.y : cur.y - 1;
        placed.push({ bt, x: cur.x, y: py, vertical: true, reversed: false });
        cur = { ...cur, mode: "v", vRun: 1, y: cur.turn === 1 ? cur.y + 2 : cur.y - 3 };
      }
    } else {
      const choice: Choice =
        cur.vRun >= VERTICAL_MIN ? (decisions.get(decKey) ?? "v") : "v";
      if (choice === "v") {
        placed.push({ bt, x: cur.x, y: cur.y, vertical: true, reversed: false });
        cur = { ...cur, vRun: cur.vRun + 1, y: cur.turn === 1 ? cur.y + 2 : cur.y - 2 };
      } else {
        // volver hacia dentro: conectar con la celda libre de la última vertical
        const connY = cur.turn === 1 ? cur.y - 1 : cur.y + 2;
        const dir: Dir = cur.turn === 1 ? "W" : "E";
        const xCursor = dir === "W" ? cur.x - 1 : cur.x + 1;
        const cellX = dir === "W" ? xCursor - 1 : xCursor;
        placed.push({
          bt,
          x: cellX,
          y: connY,
          vertical: false,
          reversed: branch === "R" ? dir === "W" : dir === "E",
        });
        cur = { ...cur, mode: "h", dir, y: connY, vRun: 0, x: dir === "E" ? xCursor + 2 : xCursor - 2 };
      }
    }
  }
  const key = `${branch}:${k + 1}`;
  const slots: Slot[] = cur.mode === "v" && cur.vRun >= VERTICAL_MIN ? ["v", "in"] : ["main"];
  return { key, slots };
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
  const decisions = useRef<Map<string, Choice>>(new Map());

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

  // nueva mano => limpiar decisiones de giro
  useEffect(() => {
    if (board.length === 0) decisions.current.clear();
  }, [board.length]);

  const cols = useMemo(() => {
    const usable = Math.max(6 * U, width - 104); // margen para las zonas de drop
    return Math.max(6, Math.floor(usable / U));
  }, [width]);

  const layout = useMemo(() => {
    const empty: { placed: Placed[]; w: number; h: number; off: number; nextL: BranchEnd | null; nextR: BranchEnd | null } = {
      placed: [], w: 0, h: 0, off: 0, nextL: null, nextR: null,
    };
    if (board.length === 0) return empty;
    const half = Math.floor(cols / 2);
    const maxX = half;
    const minX = -half;

    let startIdx = startKey ? board.findIndex((b) => b.key === startKey) : 0;
    if (startIdx < 0) startIdx = 0;
    const first = board[startIdx]!;
    const firstDouble = first.tile.a === first.tile.b;

    // primera ficha: centrada (columnas 0..1, fila 0); doble parada (col 0, filas -1..0)
    if (firstDouble) placed_first(first);
    else placed_first(first);

    function placed_first(f: BoardTile) {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      firstDouble
        ? layoutPush({ bt: f, x: 0, y: -1, vertical: true, reversed: false })
        : layoutPush({ bt: f, x: 0, y: 0, vertical: false, reversed: false });
    }
    function layoutPush(p: Placed) {
      placed_acc.push(p);
    }
    const placed_acc: Placed[] = placed;

    const initR: Cursor = { x: firstDouble ? 1 : 2, y: 0, dir: "E", mode: "h", vRun: 0, turn: 1 };
    const initL: Cursor = { x: -1, y: 0, dir: "W", mode: "h", vRun: 0, turn: -1 };

    const idxR: number[] = [];
    for (let i = startIdx + 1; i < board.length; i++) idxR.push(i);
    const idxL: number[] = [];
    for (let i = startIdx - 1; i >= 0; i--) idxL.push(i);

    const nextR = growBranch("R", board, idxR, initR, maxX, minX, placed_acc, decisions.current);
    const nextL = growBranch("L", board, idxL, initL, maxX, minX, placed_acc, decisions.current);

    // Y: normalizar a 0. X: anclado a la rejilla => la 1ª ficha SIEMPRE en el centro
    const minY = Math.min(...placed_acc.map((p) => p.y));
    const maxY = Math.max(...placed_acc.map((p) => p.y + (p.vertical ? 2 : 1)));
    for (const p of placed_acc) p.y -= minY;

    return {
      placed: placed_acc,
      w: (cols + 2) * U, // margen para esquinas que sobresalen 1 celda
      h: Math.max(1, maxY - minY) * U,
      off: half + 1,
      nextL,
      nextR,
    };
  }, [board, cols, startKey]);

  function pick(branch: Branch, choice?: Choice) {
    const info = branch === "L" ? layout.nextL : layout.nextR;
    if (choice && info) decisions.current.set(info.key, choice);
    onDropSide(branch === "L" ? "left" : "right");
  }

  return (
    <div ref={ref} className="relative min-h-[26vh] w-full px-12 py-3">
      {showZones ? (
        <>
          <SideZones
            side="left"
            slots={layout.nextL?.slots ?? ["main"]}
            enabled={leftEnabled}
            onPick={(c) => pick("L", c)}
          />
          <SideZones
            side="right"
            slots={layout.nextR?.slots ?? ["main"]}
            enabled={rightEnabled}
            onPick={(c) => pick("R", c)}
          />
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
                ? { a: t.left, b: t.right }
                : p.reversed
                  ? { a: t.right, b: t.left }
                  : { a: t.left, b: t.right };
              return (
                <div
                  key={`${t.key}-${i}`}
                  className="animate-tile-drop absolute"
                  style={{ left: (p.x + layout.off) * U, top: p.y * U }}
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

function SideZones({
  side,
  slots,
  enabled,
  onPick,
}: {
  side: Side;
  slots: Slot[];
  enabled: boolean;
  onPick: (choice?: Choice) => void;
}) {
  const [over, setOver] = useState<string | null>(null);
  const base = cn(
    "absolute z-20 flex w-10 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed text-[10px] font-bold uppercase tracking-wider transition-all",
    side === "left" ? "left-1" : "right-1",
    enabled ? "border-gold/70 text-gold" : "cursor-not-allowed border-white/15 text-white/25",
  );
  const handlers = (id: string, act: () => void) => ({
    onClick: () => enabled && act(),
    onDragOver: (e: React.DragEvent) => {
      if (!enabled) return;
      e.preventDefault();
      setOver(id);
    },
    onDragLeave: () => setOver((o) => (o === id ? null : o)),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setOver(null);
      if (enabled) act();
    },
  });

  if (slots.length < 2) {
    return (
      <button
        {...handlers("main", () => onPick())}
        className={cn(base, "inset-y-2", over === "main" && enabled && "scale-105 border-gold bg-gold/15")}
        aria-label={side === "left" ? "Jugar por la izquierda" : "Jugar por la derecha"}
      >
        <span className="text-lg leading-none">{side === "left" ? "◀" : "▶"}</span>
        {side === "left" ? "Izq" : "Der"}
      </button>
    );
  }
  // dos opciones: volver hacia dentro o seguir en vertical
  const opts =
    side === "right"
      ? [
          { id: "in", icon: "↩", label: "Dentro", act: () => onPick("in") },
          { id: "v", icon: "▼", label: "Seguir", act: () => onPick("v") },
        ]
      : [
          { id: "in", icon: "↪", label: "Dentro", act: () => onPick("in") },
          { id: "v", icon: "▲", label: "Seguir", act: () => onPick("v") },
        ];
  return (
    <>
      {opts.map((o, i) => (
        <button
          key={o.id}
          {...handlers(o.id, o.act)}
          className={cn(
            base,
            "h-[calc(50%-6px)]",
            i === 0 ? "top-2" : "bottom-2",
            over === o.id && enabled && "scale-105 border-gold bg-gold/15",
          )}
          aria-label={`${o.label} por la ${side === "left" ? "izquierda" : "derecha"}`}
        >
          <span className="text-lg leading-none">{o.icon}</span>
          {o.label}
        </button>
      ))}
    </>
  );
}

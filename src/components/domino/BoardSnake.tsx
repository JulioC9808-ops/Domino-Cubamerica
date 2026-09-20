import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { DominoTile } from "./DominoTile";
import { type BoardTile, type Side, type Tile } from "@/lib/domino/engine";

/**
 * Tablero estilo dominó cubano/internacional (diseño alineado a Ludoteka):
 * - La ficha inicial se ubica exactamente en el CENTRO del tablero.
 * - Dobles: perpendiculares a la línea de juego.
 * - Fichas normales: horizontales a lo largo de cada fila.
 * - Serpiente simétrica:
 *   - Rama derecha (R): avanza al Este por la fila central (Y=0). Al alcanzar el
 *     límite, dobla hacia ARRIBA (Norte) a la fila -1 y regresa hacia el Oeste.
 *   - Rama izquierda (L): avanza al Oeste por la fila central (Y=0). Al alcanzar el
 *     límite, dobla hacia ABAJO (Sur) a la fila +1 y regresa hacia el Este.
 * - Las filas paralelas mantienen una separación limpia y constante sin colisiones.
 * - Las fichas son 100% sólidas y opacas, con remache central de latón.
 */
const U = 26; // Media ficha (ficha sm = 52×26 px)
const LONG = 52; // Longitud de ficha
const ROW_PITCH = 52; // Separación matemática exacta entre filas para evitar cualquier solapamiento

type Dir = "E" | "W";
type Branch = "L" | "R";

type Placed = {
  bt: BoardTile;
  left: number;
  top: number;
  vertical: boolean;
  shown: Tile;
  isOpenEnd?: boolean;
  side?: Side;
};

function growBranch(
  branch: Branch,
  board: BoardTile[],
  indices: number[],
  initCx: number,
  maxArm: number,
  placed: Placed[],
) {
  let cx = initCx;
  let row = 0;
  let dir: Dir = branch === "R" ? "E" : "W";
  // Rama R (derecha) dobla hacia arriba (-1); Rama L (izquierda) dobla hacia abajo (+1)
  const step = branch === "R" ? -1 : 1;

  for (let idx = 0; idx < indices.length; idx++) {
    const i = indices[idx]!;
    const bt = board[i]!;
    const isDouble = bt.tile.a === bt.tile.b;
    const isLastInBranch = idx === indices.length - 1;
    const centerY = row * ROW_PITCH;

    // Regla 1: Un doble en fila horizontal siempre va perpendicular (vertical)
    if (isDouble) {
      const px = dir === "E" ? cx : cx - U;
      const doubleTop =
        row === 0
          ? centerY - U
          : row > 0
            ? centerY - U / 2 // se extiende hacia afuera (abajo) para no chocar con la fila central
            : centerY - 3 * (U / 2); // se extiende hacia afuera (arriba) para no chocar con la fila central

      placed.push({
        bt,
        left: px,
        top: doubleTop,
        vertical: true,
        shown: { a: bt.tile.a, b: bt.tile.b },
        isOpenEnd: isLastInBranch,
        side: branch === "R" ? "right" : "left",
      });
      cx = dir === "E" ? cx + U : cx - U;
      continue;
    }

    // Regla 2: Verificar si la ficha horizontal cabe sin sobrepasar el brazo máximo
    const willExceed = dir === "E" ? cx + LONG > maxArm : cx - LONG < -maxArm;

    if (!willExceed) {
      // Ficha horizontal normal en la fila actual
      const px = dir === "E" ? cx : cx - LONG;
      const shown: Tile =
        branch === "R"
          ? dir === "E"
            ? { a: bt.left, b: bt.right }
            : { a: bt.right, b: bt.left }
          : dir === "W"
            ? { a: bt.left, b: bt.right }
            : { a: bt.right, b: bt.left };

      placed.push({
        bt,
        left: px,
        top: centerY - U / 2,
        vertical: false,
        shown,
        isOpenEnd: isLastInBranch,
        side: branch === "R" ? "right" : "left",
      });
      cx = dir === "E" ? cx + LONG : cx - LONG;
    } else {
      // Regla 3: ¡GIRO LIMPIO A LA SIGUIENTE FILA!
      // Ficha vertical de giro que conecta la fila actual con la siguiente sin solapamientos
      const nextRow = row + step;
      const px = dir === "E" ? cx : cx - U;

      // Si sube (step === -1): top = centerY - ROW_PITCH - U / 2 (-39px desde row 0), cubriendo [-39, +13]
      // Si baja (step === +1): top = centerY - U / 2 (-13px desde row 0), cubriendo [-13, +39]
      const turnTop = step === -1 ? centerY - ROW_PITCH - U / 2 : centerY - U / 2;
      const shown: Tile = { a: bt.right, b: bt.left };

      placed.push({
        bt,
        left: px,
        top: turnTop,
        vertical: true,
        shown,
        isOpenEnd: isLastInBranch,
        side: branch === "R" ? "right" : "left",
      });

      // Pasar a la siguiente fila e invertir sentido
      row = nextRow;
      dir = dir === "E" ? "W" : "E";
      cx = dir === "W" ? px : px + U;
    }
  }
}

export function BoardSnake({
  board,
  players: _players,
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
  const [containerWidth, setContainerWidth] = useState(0);
  const initialKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      if (entry) setContainerWidth(entry.contentRect.width);
    });
    ro.observe(el);
    setContainerWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  // Mantener la clave de la ficha que abrió la mano para estabilidad del centro
  useEffect(() => {
    if (board.length === 0) {
      initialKeyRef.current = null;
    } else if (board.length === 1 && board[0]) {
      initialKeyRef.current = board[0].key;
    }
  }, [board]);

  const layout = useMemo(() => {
    const empty = { placed: [] as Placed[], w: 0, h: 0, offX: 0, offY: 0 };
    if (board.length === 0) return empty;

    // Calcular límite de brazo horizontal antes de doblar:
    // Permite que la hilera avance con holgura por la mesa (6 a 7 fichas) antes de virar
    const usableWidth = Math.max(300, containerWidth || 700);
    const maxArm = Math.min(360, Math.max(160, Math.floor(usableWidth / 2) - 60));

    // Identificar la ficha que abrió la mano
    let startIdx = -1;
    if (startKey) {
      startIdx = board.findIndex((b) => b.key === startKey);
    }
    if (startIdx < 0 && initialKeyRef.current) {
      startIdx = board.findIndex((b) => b.key === initialKeyRef.current);
    }
    if (startIdx < 0) {
      startIdx = 0;
    }

    const first = board[startIdx]!;
    const firstDouble = first.tile.a === first.tile.b;
    const placed: Placed[] = [];

    // Ficha inicial centrada en el origen (0, 0)
    if (firstDouble) {
      placed.push({
        bt: first,
        left: -U / 2,
        top: -U,
        vertical: true,
        shown: { a: first.tile.a, b: first.tile.b },
        isOpenEnd: board.length === 1,
        side: "left",
      });
    } else {
      placed.push({
        bt: first,
        left: -U,
        top: -U / 2,
        vertical: false,
        shown: { a: first.left, b: first.right },
        isOpenEnd: board.length === 1,
        side: "left",
      });
    }

    // Índices de cada rama a partir de la ficha inicial
    const idxR: number[] = [];
    for (let i = startIdx + 1; i < board.length; i++) idxR.push(i);

    const idxL: number[] = [];
    for (let i = startIdx - 1; i >= 0; i--) idxL.push(i);

    const startRx = firstDouble ? U / 2 : U;
    const startLx = firstDouble ? -U / 2 : -U;

    growBranch("R", board, idxR, startRx, maxArm, placed);
    growBranch("L", board, idxL, startLx, maxArm, placed);

    // Calcular límites para centrado simétrico absoluto
    let minX = 0;
    let maxX = 0;
    let minY = 0;
    let maxY = 0;

    for (const p of placed) {
      const w = p.vertical ? U : LONG;
      const h = p.vertical ? LONG : U;
      minX = Math.min(minX, p.left);
      maxX = Math.max(maxX, p.left + w);
      minY = Math.min(minY, p.top);
      maxY = Math.max(maxY, p.top + h);
    }

    // Lienzo simétrico respecto al (0, 0) para que la ficha inicial esté en el medio exacto
    const pad = 24;
    const halfW = Math.max(Math.abs(minX), Math.abs(maxX), U * 2) + pad;
    const halfH = Math.max(Math.abs(minY), Math.abs(maxY), U * 2) + pad;

    return {
      placed,
      w: halfW * 2,
      h: halfH * 2,
      offX: halfW,
      offY: halfH,
    };
  }, [board, containerWidth, startKey]);

  return (
    <div
      ref={ref}
      className="relative flex min-h-[30vh] w-full items-center justify-center p-2 sm:min-h-[36vh]"
      onClick={(e) => {
        if (!showZones) return;
        // Si el usuario clica en el fondo del tablero teniendo una ficha seleccionada
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        const clickX = e.clientX;
        const centerX = rect.left + rect.width / 2;
        if (clickX < centerX) {
          if (leftEnabled) onDropSide("left");
          else if (rightEnabled) onDropSide("right");
        } else {
          if (rightEnabled) onDropSide("right");
          else if (leftEnabled) onDropSide("left");
        }
      }}
    >
      {board.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-6 py-8 text-center backdrop-blur-xs">
          <p className="text-sm font-medium text-white/70">{emptyMessage}</p>
        </div>
      ) : (
        <div className="no-scrollbar flex max-h-[48vh] max-w-full items-center justify-center overflow-auto p-2">
          <div
            className="relative transition-all duration-300"
            style={{
              width: layout.w,
              height: layout.h,
              minWidth: layout.w,
              minHeight: layout.h,
            }}
          >
            {layout.placed.map((p, i) => {
              const isPlayableEnd =
                showZones &&
                p.isOpenEnd &&
                ((p.side === "left" && leftEnabled) || (p.side === "right" && rightEnabled));

              return (
                <div
                  key={`${p.bt.key}-${i}`}
                  data-drop-side={p.isOpenEnd ? p.side : undefined}
                  className={cn(
                    "animate-tile-drop absolute transition-transform",
                    isPlayableEnd && "z-20 scale-105",
                  )}
                  style={{ left: p.left + layout.offX, top: p.top + layout.offY }}
                >
                  <DominoTile
                    tile={p.shown}
                    orientation={p.vertical ? "v" : "h"}
                    size="sm"
                    className={cn(
                      isPlayableEnd &&
                        "cursor-pointer ring-2 ring-gold shadow-[0_0_12px_rgba(255,215,0,0.6)]",
                    )}
                    onClick={
                      isPlayableEnd
                        ? (e) => {
                            e.stopPropagation();
                            onDropSide(p.side === "left" ? "left" : "right");
                          }
                        : undefined
                    }
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

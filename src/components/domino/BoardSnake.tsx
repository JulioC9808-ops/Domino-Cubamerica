import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { DominoTile } from "./DominoTile";
import { layoutSnake } from "@/lib/domino/board-layout";
import type { BoardTile, Side } from "@/lib/domino/engine";

export function BoardSnake({ board, startKey, emptyMessage, leftEnabled, rightEnabled, showZones, onDropSide, impactKey }: {
  board: BoardTile[];
  players: number;
  startKey?: string | undefined;
  emptyMessage: string;
  leftEnabled: boolean;
  rightEnabled: boolean;
  showZones: boolean;
  onDropSide: (side: Side) => void;
  impactKey?: string | undefined;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [zoom, setZoom] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  const layout = useMemo(() => layoutSnake(board, startKey, width || 360), [board, startKey, width]);
  useEffect(() => {
    const el = scroller.current;
    if (!el || !board.length) return;
    el.scrollLeft = Math.max(0, (el.scrollWidth - el.clientWidth) / 2);
    el.scrollTop = Math.max(0, (el.scrollHeight - el.clientHeight) / 2);
  }, [layout.width, layout.height, board.length, zoom]);

  return (
    <div ref={ref} className="relative flex min-h-[32vh] w-full min-w-0 items-center justify-center sm:min-h-[40vh]">
      {board.length === 0 ? (
        <p className="px-3 text-center text-sm font-medium text-foreground/70">{emptyMessage}</p>
      ) : (
        <div className="relative w-full min-w-0">
          <div className="absolute bottom-1 right-1 z-30 flex gap-1">
            <button type="button" title="Alejar tablero" aria-label="Alejar tablero" className="rounded bg-card/80 px-2 py-1 text-foreground" onClick={() => setZoom((v) => Math.max(0.6, +(v - 0.2).toFixed(1)))}>−</button>
            <button type="button" title="Acercar tablero" aria-label="Acercar tablero" className="rounded bg-card/80 px-2 py-1 text-foreground" onClick={() => setZoom((v) => Math.min(1.8, +(v + 0.2).toFixed(1)))}>+</button>
          </div>
          <div ref={scroller} className="no-scrollbar max-h-[46vh] w-full overflow-auto overscroll-contain touch-pan-x sm:max-h-[55vh]" onWheel={(e) => {
            if (e.ctrlKey) {
              e.preventDefault();
              setZoom((v) => Math.min(1.8, Math.max(0.6, +(v - Math.sign(e.deltaY) * 0.1).toFixed(1))));
            }
          }}>
            <div className="relative mx-auto" style={{ width: layout.width * zoom, height: layout.height * zoom }}>
              <div className="absolute left-0 top-0 origin-top-left" style={{ width: layout.width, height: layout.height, transform: `scale(${zoom})` }}>
                {layout.tiles.map((tile) => {
                  const enabled = showZones && tile.side && (tile.side === "left" ? leftEnabled : rightEnabled);
                  return <div key={tile.bt.key} data-drop-side={tile.side} className={cn("absolute", tile.bt.key === impactKey ? "animate-domino-impact" : "animate-tile-drop", enabled && "z-20")}
                    style={{ left: tile.x + layout.offsetX, top: tile.y + layout.offsetY }}>
                    <DominoTile tile={tile.shown} orientation={tile.vertical ? "v" : "h"} size="sm"
                      className={cn(enabled && "cursor-pointer ring-2 ring-gold shadow-[0_0_10px_var(--gold)]")}
                      onClick={enabled ? () => onDropSide(tile.side === "left" ? "left" : "right") : undefined} />
                  </div>;
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

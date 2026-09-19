import { cn } from "@/lib/utils";
import type { Tile } from "@/lib/domino/engine";

/** Posiciones [fila, columna] en una rejilla 3x3 para 0..9 puntos. */
const PIP_LAYOUT: Record<number, [number, number][]> = {
  0: [],
  1: [[1, 1]],
  2: [
    [0, 0],
    [2, 2],
  ],
  3: [
    [0, 0],
    [1, 1],
    [2, 2],
  ],
  4: [
    [0, 0],
    [0, 2],
    [2, 0],
    [2, 2],
  ],
  5: [
    [0, 0],
    [0, 2],
    [1, 1],
    [2, 0],
    [2, 2],
  ],
  6: [
    [0, 0],
    [0, 2],
    [1, 0],
    [1, 2],
    [2, 0],
    [2, 2],
  ],
  7: [
    [0, 0],
    [0, 2],
    [1, 0],
    [1, 1],
    [1, 2],
    [2, 0],
    [2, 2],
  ],
  8: [
    [0, 0],
    [0, 1],
    [0, 2],
    [1, 0],
    [1, 2],
    [2, 0],
    [2, 1],
    [2, 2],
  ],
  9: [
    [0, 0],
    [0, 1],
    [0, 2],
    [1, 0],
    [1, 1],
    [1, 2],
    [2, 0],
    [2, 1],
    [2, 2],
  ],
};

function Face({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("relative grid h-full w-full grid-cols-3 grid-rows-3 p-[14%]", className)}>
      {PIP_LAYOUT[value]?.map(([r, c], i) => (
        <span
          key={i}
          className="rounded-full bg-pip shadow-[inset_0_-1px_1px_oklch(1_0_0/0.35)]"
          style={{
            gridRow: r + 1,
            gridColumn: c + 1,
            width: "72%",
            height: "72%",
            placeSelf: "center",
          }}
        />
      ))}
    </div>
  );
}

export type TileSize = "xs" | "sm" | "md" | "lg";

const SIZES: Record<TileSize, { long: number; short: number }> = {
  xs: { long: 34, short: 17 },
  sm: { long: 52, short: 26 },
  md: { long: 72, short: 36 },
  lg: { long: 96, short: 48 },
};

export const tileDims = (size: TileSize) => SIZES[size];

type Props = {
  tile?: Tile;
  /** "h" = tumbada (valores izquierda/derecha), "v" = parada (arriba/abajo) */
  orientation?: "h" | "v";
  size?: TileSize;
  faceDown?: boolean;
  selected?: boolean;
  playable?: boolean;
  dimmed?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
};

export function DominoTile({
  tile,
  orientation = "v",
  size = "md",
  faceDown,
  selected,
  playable,
  dimmed,
  className,
  style,
  onClick,
  draggable,
  onDragStart,
  onDragEnd,
}: Props) {
  const dims = SIZES[size];
  const width = orientation === "v" ? dims.short : dims.long;
  const height = orientation === "v" ? dims.long : dims.short;
  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "relative shrink-0 select-none rounded-[18%/9%] transition-all duration-200",
        faceDown
          ? "bg-[linear-gradient(150deg,var(--rail),color-mix(in_oklab,var(--rail)_65%,black))] ring-1 ring-black/40"
          : "bg-[linear-gradient(160deg,var(--bone),var(--bone-edge))] ring-1 ring-black/25",
        "shadow-[var(--shadow-tile)]",
        onClick && "cursor-pointer",
        playable && "hover:-translate-y-1.5 hover:shadow-[0_14px_26px_-10px_oklch(0_0_0/0.8)]",
        selected &&
          "-translate-y-2 ring-2 ring-gold shadow-[0_0_0_3px_color-mix(in_oklab,var(--gold)_35%,transparent),0_16px_28px_-12px_oklch(0_0_0/0.85)]",
        dimmed && "opacity-45 saturate-50",
        className,
      )}
      style={{
        width,
        height,
        // textura del skin pintada sobre el gradiente (solo fichas visibles)
        backgroundImage: faceDown ? undefined : "var(--bone-texture, none)",
        backgroundBlendMode: faceDown ? undefined : "overlay",
        ...style,
      }}
    >
      {faceDown ? (
        <div className="absolute inset-[12%] rounded-[8%] border border-white/10 bg-[repeating-linear-gradient(45deg,oklch(1_0_0/0.05)_0_3px,transparent_3px_6px)]" />
      ) : (
        <div className={cn("flex h-full w-full", orientation === "v" ? "flex-col" : "flex-row")}>
          <div className="relative flex-1">
            <Face value={tile?.a ?? 0} />
          </div>
          <div className={cn("bg-pip/25", orientation === "v" ? "mx-[12%] h-px" : "my-[12%] w-px")} />
          <div className="relative flex-1">
            <Face value={tile?.b ?? 0} />
          </div>
        </div>
      )}
    </div>
  );
}

import type { BoardTile, Side, Tile } from "./engine";

/** Grid geometry: each pip face occupies one 26px unit. */
export const U = 26;
const ROW = 2 * U;
export type PositionedTile = {
  bt: BoardTile;
  x: number;
  y: number;
  vertical: boolean;
  shown: Tile;
  side?: Side;
};

export type SnakeLayout = {
  tiles: PositionedTile[];
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
};

/** Branches are traversed from the opening tile toward their open end. */
function extend(
  board: BoardTile[], indices: number[], side: Side, arm: number, tiles: PositionedTile[],
) {
  let x = side === "right" ? (tiles[0]?.vertical ? U / 2 : U) : (tiles[0]?.vertical ? -U / 2 : -U);
  let row = 0;
  let dir: 1 | -1 = side === "right" ? 1 : -1;
  const outward = side === "right" ? 1 : -1;

  indices.forEach((index, position) => {
    const bt = board[index];
    if (!bt) return;
    const end = position === indices.length - 1 ? side : undefined;
    const double = bt.tile.a === bt.tile.b;
    if (double) {
      // A double occupies one unit in the direction of travel and crosses the row center.
      const px = dir === 1 ? x : x - U;
      tiles.push({ bt, x: px, y: row * ROW - U, vertical: true,
        shown: bt.tile, ...(end ? { side: end } : {}) });
      x += dir * U;
      return;
    }

    const edge = x + dir * 2 * U;
    if (Math.abs(edge) <= arm) {
      const shown: Tile = side === "right"
        ? (dir === 1 ? { a: bt.left, b: bt.right } : { a: bt.right, b: bt.left })
        : (dir === -1 ? { a: bt.left, b: bt.right } : { a: bt.right, b: bt.left });
      tiles.push({ bt, x: dir === 1 ? x : x - 2 * U, y: row * ROW - U / 2,
        vertical: false, shown, ...(end ? { side: end } : {}) });
      x = edge;
      return;
    }

    // Corner: its near half touches the previous face and its far face touches
    // the return-row tile along a full 1U edge. Odd rows never overlap.
    const px = dir === 1 ? x : x - U;
    const y = row * ROW + (outward === 1 ? -U / 2 : -3 * U / 2);
    const near = side === "right" ? bt.left : bt.right;
    const far = side === "right" ? bt.right : bt.left;
    tiles.push({ bt, x: px, y, vertical: true,
      shown: outward === 1 ? { a: near, b: far } : { a: far, b: near },
      ...(end ? { side: end } : {}) });
    row += outward;
    dir = dir === 1 ? -1 : 1;
    x = dir === -1 ? px + U : px;
  });
}

export function layoutSnake(board: BoardTile[], startKey: string | undefined, usableWidth: number): SnakeLayout {
  if (!board.length) return { tiles: [], width: 0, height: 0, offsetX: 0, offsetY: 0 };
  const startIndex = Math.max(0, board.findIndex((tile) => tile.key === startKey));
  const first = board[startIndex];
  if (!first) return { tiles: [], width: 0, height: 0, offsetX: 0, offsetY: 0 };
  const double = first.tile.a === first.tile.b;
  const tiles: PositionedTile[] = [{ bt: first, x: double ? -U / 2 : -U,
    y: double ? -U : -U / 2, vertical: double,
    shown: double ? first.tile : { a: first.left, b: first.right },
    ...(board.length === 1 ? { side: "left" as Side } : {}) }];
  // Reserve room for the corner's full unit while allowing the two arms to bend independently.
  const arm = Math.max(3 * U, Math.floor((usableWidth - 72) / (2 * U)) * U);
  extend(board, Array.from({ length: board.length - startIndex - 1 }, (_, i) => startIndex + i + 1), "right", arm, tiles);
  extend(board, Array.from({ length: startIndex }, (_, i) => startIndex - i - 1), "left", arm, tiles);
  const minX = Math.min(...tiles.map((tile) => tile.x));
  const maxX = Math.max(...tiles.map((tile) => tile.x + (tile.vertical ? U : 2 * U)));
  const minY = Math.min(...tiles.map((tile) => tile.y));
  const maxY = Math.max(...tiles.map((tile) => tile.y + (tile.vertical ? 2 * U : U)));
  const halfW = Math.max(-minX, maxX) + U;
  const halfH = Math.max(-minY, maxY) + U;
  return { tiles, width: halfW * 2, height: halfH * 2, offsetX: halfW, offsetY: halfH };
}

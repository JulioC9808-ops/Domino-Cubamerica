import { describe, expect, it } from "vitest";
import { layoutSnake, U } from "./board-layout";
import type { BoardTile } from "./engine";

const chain = (count: number, start = Math.floor(count / 2)): BoardTile[] =>
  Array.from({ length: count }, (_, i) => ({
    key: `tile-${i}`, tile: { a: 3, b: 3 }, left: 3, right: 3, playedBy: 0,
  })).map((tile, i) => i === start ? tile : ({ ...tile, tile: { a: 3, b: 4 } }));

function rect(tile: ReturnType<typeof layoutSnake>["tiles"][number]) {
  return { x: tile.x, y: tile.y, w: tile.vertical ? U : 2 * U, h: tile.vertical ? 2 * U : U };
}

describe("domino snake grid", () => {
  it.each([1, 2, 8, 28, 55])("keeps %i tiles on distinct, touching paths", (count) => {
    const board = chain(count);
    const mid = Math.floor(count / 2);
    const layout = layoutSnake(board, board[mid]?.key, 320);
    expect(layout.tiles).toHaveLength(count);
    expect(layout.tiles[0]?.x).toBe(-U / 2);
    for (let i = 0; i < layout.tiles.length; i++) {
      const a = layout.tiles[i];
      if (!a) continue;
      const ar = rect(a);
      expect(ar.x + layout.offsetX).toBeGreaterThanOrEqual(0);
      expect(ar.x + ar.w + layout.offsetX).toBeLessThanOrEqual(layout.width);
      for (let j = i + 1; j < layout.tiles.length; j++) {
        const b = layout.tiles[j];
        if (!b) continue;
        const br = rect(b);
        expect(Math.min(ar.x + ar.w, br.x + br.w) - Math.max(ar.x, br.x) > 0 &&
          Math.min(ar.y + ar.h, br.y + br.h) - Math.max(ar.y, br.y) > 0).toBe(false);
      }
    }
    for (const side of ["left", "right"] as const) {
      const branch = layout.tiles.filter((tile) => side === "left"
        ? board.findIndex((b) => b.key === tile.bt.key) < mid
        : board.findIndex((b) => b.key === tile.bt.key) > mid);
      let previous = layout.tiles[0];
      for (const tile of branch) {
        if (!previous) break;
        const a = rect(previous), b = rect(tile);
        const horizontalContact = (a.x + a.w === b.x || b.x + b.w === a.x) && Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) >= U;
        const verticalContact = (a.y + a.h === b.y || b.y + b.h === a.y) && Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) >= U;
        expect(horizontalContact || verticalContact).toBe(true);
        previous = tile;
      }
    }
  });
});

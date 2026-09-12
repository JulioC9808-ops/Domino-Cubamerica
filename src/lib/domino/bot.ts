import {
  type GameState,
  type Side,
  type Tile,
  canPlaceTile,
  handPips,
  teamOfSeat,
  tilePips,
} from "./engine";

export type BotMove = { tile: Tile; side: Side } | null;

/**
 * Bot con criterio de dominó cubano:
 *  - Sale por el palo que más tiene (dominar el juego).
 *  - Trata de ahogar al rival que juega después.
 *  - Se guarda los dobles altos solo si tiene con qué defenderlos.
 *  - Bota puntos alto cuando la mano se ve perdida.
 */
export function chooseBotMove(state: GameState, seat: number): BotMove {
  const hand = state.hands[seat] ?? [];
  if (!hand.length) return null;

  const options: { tile: Tile; side: Side }[] = [];
  for (const tile of hand) {
    if (state.board.length === 0) {
      options.push({ tile, side: "right" });
      continue;
    }
    const c = canPlaceTile(state, tile);
    if (c.left) options.push({ tile, side: "left" });
    if (c.right) options.push({ tile, side: "right" });
  }
  if (!options.length) return null;

  const suitCount = new Map<number, number>();
  for (const t of hand) {
    suitCount.set(t.a, (suitCount.get(t.a) ?? 0) + 1);
    if (t.b !== t.a) suitCount.set(t.b, (suitCount.get(t.b) ?? 0) + 1);
  }

  const rightOpponent = (seat + 1) % state.players;
  const starvedSuits = suitsPassedBy(state, rightOpponent);
  const avgPips = state.variant.maxPip;
  const behind = handPips(hand) > hand.length * avgPips * 0.6;

  let best = options[0]!;
  let bestScore = -Infinity;

  for (const opt of options) {
    const { tile, side } = opt;
    const end = state.board.length === 0 ? null : side === "left" ? state.leftEnd! : state.rightEnd!;
    const outer = end === null ? tile.b : tile.a === end ? tile.b : tile.a;

    let score = 0;

    // dominar: dejar en la punta el palo del que más tengo
    score += (suitCount.get(outer) ?? 0) * 6;

    // ahogar al de la derecha
    if (starvedSuits.has(outer)) score += 18;

    // soltar dobles temprano, valen y estorban
    if (tile.a === tile.b) score += 7;

    // botar puntos si vamos perdiendo o si la mano está avanzada
    const pips = tilePips(tile);
    score += behind ? pips * 1.2 : pips * 0.45;

    // no dejar punta que solo yo puedo tapar si me quedo sin esa ficha
    const remainingWithOuter = hand.filter(
      (t) => t !== tile && (t.a === outer || t.b === outer),
    ).length;
    if (remainingWithOuter === 0) score -= 9;

    // si mi pareja está a una ficha de pegarse, abrir juego
    if (state.players === 4) {
      const partner = (seat + 2) % 4;
      if (
        (state.hands[partner]?.length ?? 7) <= 2 &&
        teamOfSeat(partner, state.players) === teamOfSeat(seat, state.players)
      ) {
        score += (suitCount.get(outer) ?? 0) * 2;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      best = opt;
    }
  }

  return best;
}

function suitsPassedBy(state: GameState, seat: number): Set<number> {
  const passed = new Set<number>();
  let l: number | null = null;
  let r: number | null = null;

  for (const ev of state.events) {
    if (ev.type === "play") {
      if (l === null) {
        l = ev.tile.a;
        r = ev.tile.b;
      } else if (ev.side === "left") {
        l = ev.tile.a === l ? ev.tile.b : ev.tile.a;
      } else {
        r = ev.tile.a === r ? ev.tile.b : ev.tile.a;
      }
    }
    if (ev.type === "pass" && ev.seat === seat) {
      if (l !== null) passed.add(l);
      if (r !== null) passed.add(r);
    }
  }
  return passed;
}

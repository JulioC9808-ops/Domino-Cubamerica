/**
 * Motor de dominó — soporta doble 6 y doble 9, en pareja (4 jugadores) o 1 vs 1.
 *
 * Reglas implementadas:
 *  - Doble 6: 28 fichas. Doble 9: 55 fichas. No hay pozo.
 *  - Pareja: asientos 0 y 2 (equipo 0) contra 1 y 3 (equipo 1).
 *  - 1 vs 1: asiento 0 (equipo 0) contra asiento 1 (equipo 1).
 *  - La primera mano la abre quien tenga el doble mayor. Las siguientes las abre
 *    el ganador de la mano anterior (en tranque, el de menos puntos).
 *  - Turno en sentido horario.
 *  - Si un jugador no puede jugar, pasa. Pases seguidos de todos = tranque.
 *  - Dominó: la pareja del que se pega suma los puntos de las manos rivales.
 *  - Tranque: gana la pareja con menos puntos y suma TODOS los puntos de la mesa.
 *    Empate = nadie puntúa.
 */

export type Tile = { a: number; b: number };
export type Side = "left" | "right";
export type Phase = "playing" | "hand_over" | "game_over";

export type GameMode = "pairs" | "solo";
export type MaxPip = 6 | 9;

export type Variant = {
  mode: GameMode;
  maxPip: MaxPip;
};

export const VARIANTS: { id: string; label: string; short: string; variant: Variant }[] = [
  {
    id: "pairs-6",
    label: "Doble 6 · en pareja",
    short: "Doble 6 · 2v2",
    variant: { mode: "pairs", maxPip: 6 },
  },
  {
    id: "pairs-9",
    label: "Doble 9 · en pareja",
    short: "Doble 9 · 2v2",
    variant: { mode: "pairs", maxPip: 9 },
  },
  {
    id: "solo-6",
    label: "Doble 6 · 1 vs 1",
    short: "Doble 6 · 1v1",
    variant: { mode: "solo", maxPip: 6 },
  },
  {
    id: "solo-9",
    label: "Doble 9 · 1 vs 1",
    short: "Doble 9 · 1v1",
    variant: { mode: "solo", maxPip: 9 },
  },
];

export const variantId = (v: Variant) => `${v.mode}-${v.maxPip}`;
export const playersOf = (v: Variant) => (v.mode === "pairs" ? 4 : 2);

/** Fichas por jugador según la modalidad (sin pozo). */
export function handSizeOf(v: Variant): number {
  if (v.maxPip === 6) return v.mode === "pairs" ? 7 : 10;
  return v.mode === "pairs" ? 10 : 14;
}

export type BoardTile = {
  tile: Tile;
  /** valores ya orientados: left conecta con la ficha anterior */
  left: number;
  right: number;
  playedBy: number;
  key: string;
};

export type GameEvent =
  | { type: "play"; seat: number; tile: Tile; side: Side }
  | { type: "pass"; seat: number }
  | { type: "domino"; seat: number; points: number }
  | { type: "blocked"; winnerTeam: number | null; points: number }
  | { type: "game_over"; winnerTeam: number };

export type GameState = {
  variant: Variant;
  players: number;
  hands: Tile[][];
  board: BoardTile[];
  turn: number;
  leftEnd: number | null;
  rightEnd: number | null;
  passStreak: number;
  scores: [number, number];
  targetScore: number;
  handNumber: number;
  starter: number;
  phase: Phase;
  events: GameEvent[];
  /** ganador de la última mano (asiento) o null si fue tranque a empate */
  lastHandWinner: number | null;
  winnerTeam: number | null;
  seed: number;
};

export const tileKey = (t: Tile) => `${Math.min(t.a, t.b)}-${Math.max(t.a, t.b)}`;
export const tilePips = (t: Tile) => t.a + t.b;
export const handPips = (hand: Tile[]) => hand.reduce((s, t) => s + tilePips(t), 0);

export const teamOfSeat = (seat: number, players: number) =>
  (players === 2 ? seat : seat % 2) as 0 | 1;
/** Compatibilidad: equipo asumiendo mesa de 4. */
export const teamOf = (seat: number) => (seat % 2) as 0 | 1;

export function fullSet(maxPip: number): Tile[] {
  const tiles: Tile[] = [];
  for (let a = 0; a <= maxPip; a++) for (let b = a; b <= maxPip; b++) tiles.push({ a, b });
  return tiles;
}

/** PRNG determinista (mulberry32) para repartos reproducibles y verificables. */
export function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates: reparto uniformemente aleatorio y justo. */
export function shuffle<T>(items: T[], rng: () => number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

export function deal(seed: number, variant: Variant): Tile[][] {
  const rng = makeRng(seed);
  const tiles = shuffle(fullSet(variant.maxPip), rng);
  const players = playersOf(variant);
  const size = handSizeOf(variant);
  const hands: Tile[][] = [];
  for (let i = 0; i < players; i++) hands.push(tiles.slice(i * size, (i + 1) * size));
  return hands;
}

/** Asiento que abre: el que tenga el doble mayor. */
function seatWithTopDouble(hands: Tile[][], maxPip: number): number {
  for (let v = maxPip; v >= 0; v--) {
    for (let s = 0; s < hands.length; s++) {
      if (hands[s]!.some((t) => t.a === v && t.b === v)) return s;
    }
  }
  return 0;
}

export function createGame(opts?: {
  seed?: number;
  targetScore?: number;
  variant?: Variant;
}): GameState {
  const variant = opts?.variant ?? { mode: "pairs", maxPip: 6 };
  const seed = opts?.seed ?? Math.floor(Math.random() * 2 ** 31);
  const hands = deal(seed, variant);
  const starter = seatWithTopDouble(hands, variant.maxPip);
  return {
    variant,
    players: playersOf(variant),
    hands,
    board: [],
    turn: starter,
    leftEnd: null,
    rightEnd: null,
    passStreak: 0,
    scores: [0, 0],
    targetScore: opts?.targetScore ?? 100,
    handNumber: 1,
    starter,
    phase: "playing",
    events: [],
    lastHandWinner: null,
    winnerTeam: null,
    seed,
  };
}

/** Nueva mano dentro de la misma partida. */
export function nextHand(state: GameState): GameState {
  const seed = (state.seed * 1103515245 + state.handNumber * 12345) % 2 ** 31;
  const hands = deal(seed, state.variant);
  const starter = state.lastHandWinner ?? seatWithTopDouble(hands, state.variant.maxPip);
  return {
    ...state,
    hands,
    board: [],
    turn: starter,
    leftEnd: null,
    rightEnd: null,
    passStreak: 0,
    handNumber: state.handNumber + 1,
    starter,
    phase: "playing",
    events: [],
    seed,
  };
}

export function canPlaceTile(state: GameState, tile: Tile): { left: boolean; right: boolean } {
  if (state.board.length === 0) return { left: true, right: true };
  const l = state.leftEnd!;
  const r = state.rightEnd!;
  return {
    left: tile.a === l || tile.b === l,
    right: tile.a === r || tile.b === r,
  };
}

export function hasLegalMove(state: GameState, seat: number): boolean {
  const hand = state.hands[seat] ?? [];
  if (state.board.length === 0) return hand.length > 0;
  return hand.some((t) => {
    const c = canPlaceTile(state, t);
    return c.left || c.right;
  });
}

export type MoveResult = { ok: true; state: GameState } | { ok: false; error: string };

export function playTile(state: GameState, seat: number, tile: Tile, side: Side): MoveResult {
  if (state.phase !== "playing") return { ok: false, error: "La mano ya terminó" };
  if (state.turn !== seat) return { ok: false, error: "No es tu turno" };

  const hand = state.hands[seat] ?? [];
  const idx = hand.findIndex((t) => tileKey(t) === tileKey(tile));
  if (idx === -1) return { ok: false, error: "No tienes esa ficha" };

  const actual = hand[idx]!;
  let placed: BoardTile;
  let leftEnd: number;
  let rightEnd: number;
  let board: BoardTile[];

  if (state.board.length === 0) {
    placed = {
      tile: actual,
      left: actual.a,
      right: actual.b,
      playedBy: seat,
      key: tileKey(actual),
    };
    board = [placed];
    leftEnd = actual.a;
    rightEnd = actual.b;
  } else if (side === "left") {
    const end = state.leftEnd!;
    if (actual.a !== end && actual.b !== end)
      return { ok: false, error: "Esa ficha no pega por la izquierda" };
    const outer = actual.a === end ? actual.b : actual.a;
    placed = { tile: actual, left: outer, right: end, playedBy: seat, key: tileKey(actual) };
    board = [placed, ...state.board];
    leftEnd = outer;
    rightEnd = state.rightEnd!;
  } else {
    const end = state.rightEnd!;
    if (actual.a !== end && actual.b !== end)
      return { ok: false, error: "Esa ficha no pega por la derecha" };
    const outer = actual.a === end ? actual.b : actual.a;
    placed = { tile: actual, left: end, right: outer, playedBy: seat, key: tileKey(actual) };
    board = [...state.board, placed];
    leftEnd = state.leftEnd!;
    rightEnd = outer;
  }

  const hands = state.hands.map((h, i) => (i === seat ? h.filter((_, j) => j !== idx) : h));

  let next: GameState = {
    ...state,
    hands,
    board,
    leftEnd,
    rightEnd,
    passStreak: 0,
    turn: (seat + 1) % state.players,
    events: [
      ...state.events,
      { type: "play", seat, tile: actual, side: state.board.length === 0 ? "right" : side },
    ],
  };

  // ¿Dominó?
  if (hands[seat]!.length === 0) {
    const myTeam = teamOfSeat(seat, state.players);
    const losingTeam = myTeam === 0 ? 1 : 0;
    const points = hands.reduce(
      (sum, h, i) => (teamOfSeat(i, state.players) === losingTeam ? sum + handPips(h) : sum),
      0,
    );
    next = closeHand(next, seat, myTeam, points, { type: "domino", seat, points });
  }

  return { ok: true, state: next };
}

export function passTurn(state: GameState, seat: number): MoveResult {
  if (state.phase !== "playing") return { ok: false, error: "La mano ya terminó" };
  if (state.turn !== seat) return { ok: false, error: "No es tu turno" };
  if (hasLegalMove(state, seat)) return { ok: false, error: "Tienes jugada disponible" };

  const passStreak = state.passStreak + 1;
  let next: GameState = {
    ...state,
    passStreak,
    turn: (seat + 1) % state.players,
    events: [...state.events, { type: "pass", seat }],
  };

  if (passStreak >= state.players) {
    const teamPips: [number, number] = [0, 0];
    next.hands.forEach((h, i) => {
      teamPips[teamOfSeat(i, state.players)] += handPips(h);
    });
    const total = teamPips[0] + teamPips[1];
    if (teamPips[0] === teamPips[1]) {
      next = closeHand(next, null, null, 0, { type: "blocked", winnerTeam: null, points: 0 });
    } else {
      const winnerTeam = teamPips[0] < teamPips[1] ? 0 : 1;
      const candidates = Array.from({ length: state.players }, (_, s) => s).filter(
        (s) => teamOfSeat(s, state.players) === winnerTeam,
      );
      const opener = candidates.reduce((best, s) =>
        handPips(next.hands[s]!) < handPips(next.hands[best]!) ? s : best,
      );
      next = closeHand(next, opener, winnerTeam, total, {
        type: "blocked",
        winnerTeam,
        points: total,
      });
    }
  }

  return { ok: true, state: next };
}

function closeHand(
  state: GameState,
  winnerSeat: number | null,
  winnerTeam: number | null,
  points: number,
  event: GameEvent,
): GameState {
  const scores: [number, number] = [state.scores[0], state.scores[1]];
  if (winnerTeam === 0) scores[0] += points;
  if (winnerTeam === 1) scores[1] += points;

  const events = [...state.events, event];
  const gameWinner = scores[0] >= state.targetScore ? 0 : scores[1] >= state.targetScore ? 1 : null;

  if (gameWinner !== null) events.push({ type: "game_over", winnerTeam: gameWinner });

  return {
    ...state,
    scores,
    events,
    lastHandWinner: winnerSeat,
    phase: gameWinner !== null ? "game_over" : "hand_over",
    winnerTeam: gameWinner,
  };
}

/** Fichas que un asiento puede jugar ahora mismo, con sus lados válidos. */
export function legalMoves(state: GameState, seat: number) {
  const hand = state.hands[seat] ?? [];
  const moves: { tile: Tile; sides: Side[] }[] = [];
  for (const tile of hand) {
    if (state.board.length === 0) {
      moves.push({ tile, sides: ["right"] });
      continue;
    }
    const c = canPlaceTile(state, tile);
    const sides: Side[] = [];
    if (c.left) sides.push("left");
    if (c.right) sides.push("right");
    if (sides.length) moves.push({ tile, sides });
  }
  return moves;
}

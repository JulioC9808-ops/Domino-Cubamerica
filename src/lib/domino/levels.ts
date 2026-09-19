/**
 * Sistema de niveles y desbloqueos.
 *
 * Niveles ilimitados: cada nivel exige más XP que el anterior (curva ^1.45),
 * pero a mayor nivel también se ganan más puntos por partida, así la subida
 * nunca se detiene aunque sí se hace progresivamente más lenta.
 */

export const xpForLevel = (level: number) => Math.round(120 * Math.pow(level, 1.45));

export function levelFromXp(totalXp: number): { level: number; into: number; need: number } {
  let level = 1;
  let rest = Math.max(0, Math.floor(totalXp));
  // cota alta por seguridad, la curva crece rápido
  while (level < 9999) {
    const need = xpForLevel(level);
    if (rest < need) return { level, into: rest, need };
    rest -= need;
    level += 1;
  }
  return { level, into: 0, need: xpForLevel(level) };
}

export const totalXpForLevel = (level: number) => {
  let sum = 0;
  for (let l = 1; l < level; l++) sum += xpForLevel(l);
  return sum;
};

/** Puntos de experiencia ganados al terminar una partida. */
export function xpForMatch(opts: {
  level: number;
  won: boolean;
  pointsFor: number;
  pointsAgainst: number;
  hands: number;
}): number {
  const base = opts.won ? 60 : 18;
  const margin = Math.max(0, opts.pointsFor - opts.pointsAgainst) * 0.35;
  const grind = Math.min(30, opts.hands * 3);
  const levelBonus = 1 + opts.level * 0.03; // a más nivel, más puntos por partida
  return Math.round((base + margin + grind) * levelBonus);
}

/** Ajuste de ranking estilo Elo. */
export function eloDelta(mine: number, theirs: number, won: boolean, k = 28) {
  const expected = 1 / (1 + Math.pow(10, (theirs - mine) / 400));
  return Math.round(k * ((won ? 1 : 0) - expected));
}

export type RankTier = { id: string; label: string; min: number; color: string };

export const RANK_TIERS: RankTier[] = [
  { id: "callejero", label: "Callejero", min: 0, color: "oklch(0.68 0.03 250)" },
  { id: "cuartelero", label: "Cuartelero", min: 900, color: "oklch(0.7 0.09 145)" },
  { id: "data", label: "Data", min: 1100, color: "oklch(0.7 0.13 200)" },
  { id: "tranquero", label: "Tranquero", min: 1300, color: "oklch(0.74 0.16 47)" },
  { id: "matador", label: "Matador", min: 1550, color: "oklch(0.7 0.18 15)" },
  { id: "leyenda", label: "Leyenda", min: 1800, color: "oklch(0.85 0.14 88)" },
];

export const tierOf = (elo: number) =>
  [...RANK_TIERS].reverse().find((t) => elo >= t.min) ?? RANK_TIERS[0]!;

export type UnlockKind = "theme" | "skin" | "frame" | "flag" | "title" | "emoji";

export type Unlockable = {
  id: string;
  kind: UnlockKind;
  label: string;
  level: number;
  /** vista previa: color, emoji o gradiente */
  preview?: string;
};

export const UNLOCKABLES: Unlockable[] = [
  // temas de mesa
  { id: "habana", kind: "theme", label: "Habana nocturna", level: 1 },
  { id: "carbon", kind: "theme", label: "Carbón", level: 2 },
  { id: "casino", kind: "theme", label: "Verde casino", level: 6 },
  { id: "caribe", kind: "theme", label: "Caribe", level: 12 },
  { id: "vino", kind: "theme", label: "Vino tinto", level: 22 },
  { id: "arena", kind: "theme", label: "Arena de Varadero", level: 33 },
  { id: "medianoche", kind: "theme", label: "Medianoche", level: 45 },

  // banderas de fondo (recompensa)
{ id: "cu", kind: "flag", label: "Cuba", level: 1 },
{ id: "do", kind: "flag", label: "República Dominicana", level: 2 },
{ id: "pr", kind: "flag", label: "Puerto Rico", level: 2 },
{ id: "ve", kind: "flag", label: "Venezuela", level: 3 },
{ id: "mx", kind: "flag", label: "México", level: 3 },
{ id: "co", kind: "flag", label: "Colombia", level: 4 },
{ id: "es", kind: "flag", label: "España", level: 4 },
{ id: "us", kind: "flag", label: "Estados Unidos", level: 5 },
{ id: "ar", kind: "flag", label: "Argentina", level: 6 },
{ id: "cl", kind: "flag", label: "Chile", level: 6 },
{ id: "pe", kind: "flag", label: "Perú", level: 8 },
{ id: "ec", kind: "flag", label: "Ecuador", level: 8 },
{ id: "uy", kind: "flag", label: "Uruguay", level: 10 },
{ id: "py", kind: "flag", label: "Paraguay", level: 10 },
{ id: "bo", kind: "flag", label: "Bolivia", level: 10 },
{ id: "cr", kind: "flag", label: "Costa Rica", level: 12 },
{ id: "gt", kind: "flag", label: "Guatemala", level: 12 },
{ id: "hn", kind: "flag", label: "Honduras", level: 12 },
{ id: "ni", kind: "flag", label: "Nicaragua", level: 12 },
{ id: "sv", kind: "flag", label: "El Salvador", level: 12 },
{ id: "pa", kind: "flag", label: "Panamá", level: 12 },
{ id: "ht", kind: "flag", label: "Haití", level: 15 },
{ id: "jm", kind: "flag", label: "Jamaica", level: 15 },
{ id: "br", kind: "flag", label: "Brasil", level: 18 },
{ id: "it", kind: "flag", label: "Italia", level: 18 },
{ id: "pt", kind: "flag", label: "Portugal", level: 18 },
{ id: "fr", kind: "flag", label: "Francia", level: 22 },
{ id: "de", kind: "flag", label: "Alemania", level: 22 },
{ id: "ru", kind: "flag", label: "Rusia", level: 26 },
{ id: "ca", kind: "flag", label: "Canadá", level: 26 },

  // temas (texturas de mesa)
{ id: "marmol", kind: "theme", label: "Mármol blanco", level: 4 },
{ id: "cemento", kind: "theme", label: "Cemento pulido", level: 8 },
{ id: "baldosa", kind: "theme", label: "Baldosa criolla", level: 13 },
{ id: "metal", kind: "theme", label: "Metal cepillado", level: 20 },
{ id: "marmol-negro", kind: "theme", label: "Mármol negro", level: 28 },
{ id: "caoba", kind: "theme", label: "Caoba real", level: 38 },
{ id: "cromo", kind: "theme", label: "Cromo espejo", level: 50 },
  
// fichas
{ id: "roble", kind: "skin", label: "Roble", level: 14 },
{ id: "marmol", kind: "skin", label: "Mármol", level: 24 },
{ id: "cromo", kind: "skin", label: "Cromo", level: 33 },
{ id: "estelar", kind: "skin", label: "Estelar", level: 70 },

  // diseños de ficha
  { id: "hueso", kind: "skin", label: "Hueso clásico", level: 1 },
  { id: "marfil", kind: "skin", label: "Marfil", level: 5 },
  { id: "obsidiana", kind: "skin", label: "Obsidiana", level: 10 },
  { id: "caoba", kind: "skin", label: "Caoba", level: 18 },
  { id: "jade", kind: "skin", label: "Jade", level: 28 },
  { id: "oro", kind: "skin", label: "Oro viejo", level: 40 },
  { id: "neon", kind: "skin", label: "Neón", level: 55 },

  // marcos de avatar
  { id: "none", kind: "frame", label: "Sin marco", level: 1 },
  { id: "bronce", kind: "frame", label: "Bronce", level: 3 },
  { id: "plata", kind: "frame", label: "Plata", level: 8 },
  { id: "oro", kind: "frame", label: "Oro", level: 15 },
  { id: "esmeralda", kind: "frame", label: "Esmeralda", level: 25 },
  { id: "fuego", kind: "frame", label: "Fuego", level: 35 },
  { id: "diamante", kind: "frame", label: "Diamante", level: 50 },

  // títulos
  { id: "novato", kind: "title", label: "Novato", level: 1 },
  { id: "cuartelero", kind: "title", label: "Cuartelero", level: 4 },
  { id: "data", kind: "title", label: "Data", level: 9 },
  { id: "tranquero", kind: "title", label: "Tranquero", level: 14 },
  { id: "sabroso", kind: "title", label: "Sabroso", level: 20 },
  { id: "matador", kind: "title", label: "Matador", level: 30 },
  { id: "capicua", kind: "title", label: "Capicúa", level: 42 },
  { id: "leyenda", kind: "title", label: "Leyenda del barrio", level: 60 },

  // paquetes de emojis para el chat rápido
  { id: "basico", kind: "emoji", label: "Emojis básicos", level: 1 },
  { id: "barrio", kind: "emoji", label: "Emojis de barrio", level: 7 },
  { id: "fiesta", kind: "emoji", label: "Emojis de fiesta", level: 16 },
  { id: "picante", kind: "emoji", label: "Emojis picantes", level: 26 },
];

export const unlocksFor = (kind: UnlockKind) => UNLOCKABLES.filter((u) => u.kind === kind);
export const isUnlocked = (u: Unlockable, level: number) => level >= u.level;

/** Lo que se desbloquea exactamente al llegar a `level`. */
export const unlockedAt = (level: number) => UNLOCKABLES.filter((u) => u.level === level);

/** Diseños de ficha: tokens CSS aplicados en la mesa. */
export const TILE_SKINS: Record<string, { bone: string; boneEdge: string; pip: string }> = {
  hueso: { bone: "oklch(0.96 0.017 85)", boneEdge: "oklch(0.86 0.03 82)", pip: "oklch(0.24 0.03 260)" },
  marfil: { bone: "oklch(0.97 0.03 95)", boneEdge: "oklch(0.88 0.05 92)", pip: "oklch(0.32 0.06 60)" },
  obsidiana: { bone: "oklch(0.28 0.02 260)", boneEdge: "oklch(0.18 0.02 260)", pip: "oklch(0.92 0.02 260)" },
  caoba: { bone: "oklch(0.48 0.09 40)", boneEdge: "oklch(0.34 0.08 35)", pip: "oklch(0.95 0.02 80)" },
  jade: { bone: "oklch(0.72 0.11 160)", boneEdge: "oklch(0.55 0.1 160)", pip: "oklch(0.2 0.04 160)" },
  oro: { bone: "oklch(0.85 0.13 88)", boneEdge: "oklch(0.68 0.14 70)", pip: "oklch(0.26 0.05 60)" },
  neon: { bone: "oklch(0.32 0.05 300)", boneEdge: "oklch(0.2 0.05 300)", pip: "oklch(0.85 0.2 190)" },
};

export const getSkin = (id?: string | null) => TILE_SKINS[id ?? "hueso"] ?? TILE_SKINS["hueso"]!;

/** Marcos de avatar: anillo CSS. */
export const FRAME_RING: Record<string, string> = {
  none: "1px solid color-mix(in oklab, var(--border) 80%, transparent)",
  bronce: "2px solid oklch(0.62 0.1 55)",
  plata: "2px solid oklch(0.82 0.02 250)",
  oro: "2px solid oklch(0.85 0.14 88)",
  esmeralda: "2px solid oklch(0.72 0.15 155)",
  fuego: "2px solid oklch(0.68 0.2 35)",
  diamante: "2px solid oklch(0.88 0.09 200)",
};
export const TILE_SKINS: Record<string, { bone: string; boneEdge: string; pip: string; texture?: string }> = {
  hueso: { bone: "oklch(0.96 0.017 85)", boneEdge: "oklch(0.86 0.03 82)", pip: "oklch(0.24 0.03 260)" },
  marfil: { bone: "oklch(0.97 0.03 95)", boneEdge: "oklch(0.88 0.05 92)", pip: "oklch(0.32 0.06 60)", texture: `repeating-linear-gradient(3deg, oklch(0.5 0.03 85 / 0.06) 0 1px, transparent 1px 6px)` },
  obsidiana: { bone: "oklch(0.28 0.02 260)", boneEdge: "oklch(0.18 0.02 260)", pip: "oklch(0.92 0.02 260)", texture: `radial-gradient(circle at 30% 30%, oklch(1 0 0 / 0.06) 1px, transparent 1.6px) 0 0 / 7px 7px` },
  caoba: { bone: "oklch(0.48 0.09 40)", boneEdge: "oklch(0.34 0.08 35)", pip: "oklch(0.95 0.02 80)", texture: `repeating-linear-gradient(88deg, oklch(0.1 0.05 30 / 0.2) 0 1px, transparent 1px 5px, oklch(1 0 0 / 0.06) 5px 6px, transparent 6px 11px)` },
  jade: { bone: "oklch(0.72 0.11 160)", boneEdge: "oklch(0.55 0.1 160)", pip: "oklch(0.2 0.04 160)", texture: `radial-gradient(60% 40% at 30% 25%, oklch(1 0 0 / 0.25), transparent 70%)` },
  oro: { bone: "oklch(0.85 0.13 88)", boneEdge: "oklch(0.68 0.14 70)", pip: "oklch(0.26 0.05 60)", texture: `repeating-linear-gradient(90deg, oklch(1 0 0 / 0.1) 0 1px, transparent 1px 3px, oklch(0 0 0 / 0.08) 3px 4px, transparent 4px 6px)` },
  neon: { bone: "oklch(0.32 0.05 300)", boneEdge: "oklch(0.2 0.05 300)", pip: "oklch(0.85 0.2 190)" },
  
  // NUEVOS
  roble: { bone: "oklch(0.78 0.06 70)", boneEdge: "oklch(0.64 0.06 65)", pip: "oklch(0.3 0.05 50)", texture: `repeating-linear-gradient(91deg, oklch(0.2 0.06 60 / 0.16) 0 1px, transparent 1px 6px, oklch(1 0 0 / 0.08) 6px 7px, transparent 7px 13px)` },
  marmol: { bone: "oklch(0.94 0.008 250)", boneEdge: "oklch(0.82 0.012 250)", pip: "oklch(0.4 0.03 250)", texture: `repeating-linear-gradient(110deg, transparent 0 10px, oklch(0.5 0.02 250 / 0.18) 10px 10.8px, transparent 10.8px 24px), radial-gradient(40% 30% at 70% 30%, oklch(1 0 0 / 0.5), transparent 70%)` },
  cromo: { bone: "oklch(0.82 0.005 250)", boneEdge: "oklch(0.65 0.008 250)", pip: "oklch(0.35 0.02 250)", texture: `repeating-linear-gradient(90deg, oklch(1 0 0 / 0.14) 0 1px, transparent 1px 2.5px, oklch(0 0 0 / 0.08) 2.5px 3.5px, transparent 3.5px 6px)` },
  estelar: { bone: "oklch(0.25 0.04 280)", boneEdge: "oklch(0.16 0.04 280)", pip: "oklch(0.9 0.08 90)", texture: `radial-gradient(1px 1px at 25% 30%, oklch(1 0 0 / 0.9), transparent), radial-gradient(1px 1px at 65% 60%, oklch(1 0 0 / 0.7), transparent), radial-gradient(1.5px 1.5px at 40% 80%, oklch(1 0 0 / 0.5), transparent) 0 0 / 22px 18px, radial-gradient(1px 1px at 85% 15%, oklch(1 0 0 / 0.8), transparent) 0 0 / 30px 26px` },
};

/**
 * Chat rápido: mensajes predeterminados + emojis.
 * No hay texto libre ni audio, así nadie puede cantarse las fichas ni hacer
 * trampas coordinándose con la pareja.
 */

export type QuickPhrase = { id: string; text: string; emoji: string };
export type QuickGroup = { id: string; label: string; phrases: QuickPhrase[] };

export const QUICK_GROUPS: QuickGroup[] = [
  {
    id: "saludo",
    label: "Saludo",
    phrases: [
      { id: "hola", text: "¡Hola!", emoji: "👋" },
      { id: "buenas", text: "Buenas a todos", emoji: "🙂" },
      { id: "suerte", text: "Suerte a todos", emoji: "🍀" },
      { id: "vamos", text: "¡Vamos allá!", emoji: "🔥" },
      { id: "chao", text: "Chao, gracias por el juego", emoji: "🤝" },
    ],
  },
  {
    id: "turno",
    label: "Turno",
    phrases: [
      { id: "sale_tu", text: "Sale tú", emoji: "👉" },
      { id: "salgo_yo", text: "Salgo yo", emoji: "🙋" },
      { id: "te_toca", text: "Te toca", emoji: "⏳" },
      { id: "apura", text: "Apura, socio", emoji: "😅" },
      { id: "pensando", text: "Déjame pensar", emoji: "🤔" },
    ],
  },
  {
    id: "juego",
    label: "Juego",
    phrases: [
      { id: "buena", text: "Buena jugada", emoji: "👏" },
      { id: "bien", text: "¡Bien!", emoji: "👍" },
      { id: "ganamos", text: "Esta la ganamos", emoji: "💪" },
      { id: "no_era", text: "No, esa no era", emoji: "🙈" },
      { id: "tranque", text: "Se va a trancar", emoji: "🧱" },
      { id: "cuidado", text: "Cuidado con esa punta", emoji: "⚠️" },
      { id: "data", text: "¡Qué data!", emoji: "🎯" },
      { id: "capicua", text: "¡Capicúa!", emoji: "✨" },
    ],
  },
  {
    id: "reaccion",
    label: "Reacción",
    phrases: [
      { id: "jaja", text: "Jajaja", emoji: "😂" },
      { id: "uf", text: "Uff…", emoji: "😮‍💨" },
      { id: "asere", text: "¡Asere!", emoji: "😲" },
      { id: "lo_siento", text: "Lo siento, pareja", emoji: "😬" },
      { id: "otra", text: "¡Otra ronda!", emoji: "🔁" },
      { id: "felicidades", text: "Felicidades", emoji: "🎉" },
    ],
  },
];

export const ALL_PHRASES = QUICK_GROUPS.flatMap((g) => g.phrases);
export const getPhrase = (id: string) => ALL_PHRASES.find((p) => p.id === id);

/** Emojis sueltos por paquete desbloqueable (ver levels.ts). */
export const EMOJI_PACKS: Record<string, string[]> = {
  basico: ["👍", "👏", "😂", "😮", "😅", "🤔", "🔥", "🙌"],
  barrio: ["🇨🇺", "🥁", "☕", "🚬", "🍹", "🧢", "🪘", "😎"],
  fiesta: ["🎉", "🎊", "🕺", "💃", "🎺", "🥳", "🍾", "✨"],
  picante: ["🌶️", "💀", "🫡", "🤡", "🙃", "😈", "🧠", "⚡"],
};

export const emojisForLevel = (level: number, unlocked: { id: string; level: number }[]) =>
  unlocked.filter((u) => level >= u.level).flatMap((u) => EMOJI_PACKS[u.id] ?? []);

export type ChatBubble = {
  id: string;
  seat: number;
  text: string;
  emoji: string;
  at: number;
};

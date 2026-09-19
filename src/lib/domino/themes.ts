export type TableTheme = {
  id: string;
  label: string;
  /** oklch felt colors */
  felt: string;
  feltDeep: string;
  rail: string;
  accent: string;
  /** textura CSS (background) pintada sobre la mesa y la bandera, muy sutil */
  texture: string;
  /** @deprecated ya no se usa: la textura de madera viene en `texture` */
  wood?: boolean;
};

export const TABLE_THEMES: TableTheme[] = [
  {
    id: "madera", // DEFAULT
    label: "Tabla de madera",
    felt: "oklch(0.46 0.08 62)",
    feltDeep: "oklch(0.3 0.06 55)",
    rail: "oklch(0.26 0.04 50)",
    accent: "oklch(0.8 0.14 80)",
    wood: true,
    texture: `repeating-linear-gradient(92deg, oklch(0 0 0 / 0.14) 0 2px, transparent 2px 9px, oklch(1 0 0 / 0.05) 9px 10px, transparent 10px 17px), repeating-linear-gradient(88deg, oklch(0 0 0 / 0.08) 0 1px, transparent 1px 27px), radial-gradient(60% 40% at 20% 30%, oklch(0 0 0 / 0.16), transparent 70%)`,
  },
  {
    id: "marmol",
    label: "Mármol blanco",
    felt: "oklch(0.88 0.01 250)",
    feltDeep: "oklch(0.78 0.015 250)",
    rail: "oklch(0.45 0.02 250)",
    accent: "oklch(0.5 0.1 250)",
    texture: `repeating-linear-gradient(115deg, transparent 0 40px, oklch(1 0 0 / 0.5) 40px 41px, transparent 41px 90px), repeating-linear-gradient(65deg, transparent 0 70px, oklch(0.6 0.02 250 / 0.35) 70px 71.5px, transparent 71.5px 160px), radial-gradient(50% 30% at 70% 40%, oklch(1 0 0 / 0.2), transparent 70%)`,
  },
  {
    id: "cemento",
    label: "Cemento pulido",
    felt: "oklch(0.52 0.01 250)",
    feltDeep: "oklch(0.4 0.01 250)",
    rail: "oklch(0.3 0.01 250)",
    accent: "oklch(0.75 0.12 60)",
    texture: `radial-gradient(circle at 25% 25%, oklch(1 0 0 / 0.08) 1px, transparent 1.6px) 0 0 / 9px 9px, radial-gradient(circle at 75% 75%, oklch(0 0 0 / 0.1) 1px, transparent 1.6px) 4px 6px / 13px 13px, radial-gradient(80% 60% at 50% 20%, oklch(1 0 0 / 0.06), transparent 70%)`,
  },
  {
    id: "baldosa",
    label: "Baldosa criolla",
    felt: "oklch(0.62 0.04 45)",
    feltDeep: "oklch(0.5 0.04 45)",
    rail: "oklch(0.35 0.03 45)",
    accent: "oklch(0.82 0.14 85)",
    texture: `linear-gradient(oklch(0 0 0 / 0.14) 2px, transparent 2px) 0 0 / 64px 64px, linear-gradient(90deg, oklch(0 0 0 / 0.14) 2px, transparent 2px) 0 0 / 64px 64px, radial-gradient(circle at 32px 32px, oklch(1 0 0 / 0.05) 6px, transparent 7px) 0 0 / 64px 64px`,
  },
  {
    id: "metal",
    label: "Metal cepillado",
    felt: "oklch(0.55 0.015 250)",
    feltDeep: "oklch(0.42 0.015 250)",
    rail: "oklch(0.28 0.01 250)",
    accent: "oklch(0.85 0.05 200)",
    texture: `repeating-linear-gradient(90deg, oklch(1 0 0 / 0.07) 0 1px, transparent 1px 3px, oklch(0 0 0 / 0.07) 3px 4px, transparent 4px 7px), linear-gradient(120deg, oklch(1 0 0 / 0.08) 0%, transparent 40%, oklch(0 0 0 / 0.08) 100%)`,
  },
  {
    id: "marmol-negro",
    label: "Mármol negro",
    felt: "oklch(0.22 0.01 260)",
    feltDeep: "oklch(0.14 0.01 260)",
    rail: "oklch(0.1 0.01 260)",
    accent: "oklch(0.88 0.04 90)",
    texture: `repeating-linear-gradient(100deg, transparent 0 55px, oklch(1 0 0 / 0.14) 55px 56px, transparent 56px 130px), repeating-linear-gradient(40deg, transparent 0 90px, oklch(1 0 0 / 0.09) 90px 91.5px, transparent 91.5px 200px)`,
  },
  {
    id: "caoba",
    label: "Caoba real",
    felt: "oklch(0.38 0.07 30)",
    feltDeep: "oklch(0.24 0.06 25)",
    rail: "oklch(0.2 0.04 30)",
    accent: "oklch(0.84 0.13 80)",
    texture: `repeating-linear-gradient(91deg, oklch(0 0 0 / 0.18) 0 2px, transparent 2px 12px, oklch(1 0 0 / 0.06) 12px 13px, transparent 13px 24px), repeating-linear-gradient(89deg, oklch(0 0 0 / 0.1) 0 1px, transparent 1px 38px), radial-gradient(55% 45% at 75% 65%, oklch(0 0 0 / 0.2), transparent 70%)`,
  },
  {
    id: "cromo",
    label: "Cromo espejo",
    felt: "oklch(0.75 0.005 250)",
    feltDeep: "oklch(0.6 0.005 250)",
    rail: "oklch(0.35 0.005 250)",
    accent: "oklch(0.6 0.12 230)",
    texture: `repeating-linear-gradient(90deg, oklch(1 0 0 / 0.16) 0 1px, transparent 1px 2px, oklch(0 0 0 / 0.1) 2px 3px, transparent 3px 5px), linear-gradient(115deg, oklch(1 0 0 / 0.3) 0%, transparent 35%, oklch(1 0 0 / 0.12) 60%, transparent 80%)`,
  },
  {
    id: "habana",
    label: "Habana nocturna",
    felt: "oklch(0.34 0.09 240)",
    feltDeep: "oklch(0.22 0.07 250)",
    rail: "oklch(0.28 0.05 40)",
    accent: "oklch(0.74 0.17 47)",
    texture: `repeating-linear-gradient(88deg, oklch(1 0 0 / 0.03) 0 1px, transparent 1px 22px)`,
  },
  {
    id: "carbon",
    label: "Carbón",
    felt: "oklch(0.3 0.015 260)",
    feltDeep: "oklch(0.18 0.01 260)",
    rail: "oklch(0.24 0.01 260)",
    accent: "oklch(0.78 0.16 195)",
    texture: `radial-gradient(circle at 30% 30%, oklch(1 0 0 / 0.04) 1px, transparent 1.5px) 0 0 / 7px 7px`,
  },
  {
    id: "casino",
    label: "Verde casino",
    felt: "oklch(0.42 0.1 158)",
    feltDeep: "oklch(0.26 0.07 160)",
    rail: "oklch(0.3 0.05 45)",
    accent: "oklch(0.8 0.14 88)",
    texture: `radial-gradient(circle at 40% 40%, oklch(1 0 0 / 0.04) 1.2px, transparent 2px) 0 0 / 10px 10px`,
  },
  {
    id: "caribe",
    label: "Caribe",
    felt: "oklch(0.52 0.1 200)",
    feltDeep: "oklch(0.34 0.08 205)",
    rail: "oklch(0.42 0.07 60)",
    accent: "oklch(0.72 0.18 25)",
    texture: `repeating-linear-gradient(178deg, oklch(1 0 0 / 0.05) 0 1px, transparent 1px 9px)`,
  },
  {
    id: "vino",
    label: "Vino tinto",
    felt: "oklch(0.35 0.11 20)",
    feltDeep: "oklch(0.22 0.08 18)",
    rail: "oklch(0.26 0.04 40)",
    accent: "oklch(0.82 0.14 85)",
    texture: `repeating-linear-gradient(92deg, oklch(0 0 0 / 0.1) 0 1px, transparent 1px 18px)`,
  },
  {
    id: "arena",
    label: "Arena de Varadero",
    felt: "oklch(0.66 0.08 80)",
    feltDeep: "oklch(0.48 0.08 70)",
    rail: "oklch(0.38 0.05 55)",
    accent: "oklch(0.62 0.14 230)",
    texture: `radial-gradient(circle at 25% 25%, oklch(0 0 0 / 0.06) 1px, transparent 1.6px) 0 0 / 8px 8px, radial-gradient(circle at 75% 75%, oklch(1 0 0 / 0.08) 1px, transparent 1.5px) 3px 5px / 11px 11px`,
  },
  {
    id: "medianoche",
    label: "Medianoche",
    felt: "oklch(0.24 0.06 290)",
    feltDeep: "oklch(0.14 0.05 295)",
    rail: "oklch(0.2 0.04 300)",
    accent: "oklch(0.8 0.17 320)",
    texture: `radial-gradient(1px 1px at 20% 30%, oklch(1 0 0 / 0.5), transparent), radial-gradient(1px 1px at 70% 60%, oklch(1 0 0 / 0.4), transparent), radial-gradient(1.5px 1.5px at 45% 80%, oklch(1 0 0 / 0.3), transparent) 0 0 / 120px 90px`,
  },
];

export const getTheme = (id?: string | null) =>
  TABLE_THEMES.find((t) => t.id === id) ?? TABLE_THEMES[0]!;

export type Flag = { code: string; emoji: string; label: string };

export const FLAGS: Flag[] = [
  { code: "cu", emoji: "🇨🇺", label: "Cuba" },
  { code: "us", emoji: "🇺🇸", label: "Estados Unidos" },
  { code: "es", emoji: "🇪🇸", label: "España" },
  { code: "mx", emoji: "🇲🇽", label: "México" },
  { code: "do", emoji: "🇩🇴", label: "República Dominicana" },
  { code: "pr", emoji: "🇵🇷", label: "Puerto Rico" },
  { code: "ve", emoji: "🇻🇪", label: "Venezuela" },
  { code: "co", emoji: "🇨🇴", label: "Colombia" },
  { code: "ar", emoji: "🇦🇷", label: "Argentina" },
  { code: "cl", emoji: "🇨🇱", label: "Chile" },
  { code: "pe", emoji: "🇵🇪", label: "Perú" },
  { code: "br", emoji: "🇧🇷", label: "Brasil" },
  { code: "ec", emoji: "🇪🇨", label: "Ecuador" },
  { code: "uy", emoji: "🇺🇾", label: "Uruguay" },
  { code: "py", emoji: "🇵🇾", label: "Paraguay" },
  { code: "bo", emoji: "🇧🇴", label: "Bolivia" },
  { code: "cr", emoji: "🇨🇷", label: "Costa Rica" },
  { code: "gt", emoji: "🇬🇹", label: "Guatemala" },
  { code: "hn", emoji: "🇭🇳", label: "Honduras" },
  { code: "ni", emoji: "🇳🇮", label: "Nicaragua" },
  { code: "sv", emoji: "🇸🇻", label: "El Salvador" },
  { code: "ht", emoji: "🇭🇹", label: "Haití" },
  { code: "jm", emoji: "🇯🇲", label: "Jamaica" },
  { code: "it", emoji: "🇮🇹", label: "Italia" },
  { code: "pt", emoji: "🇵🇹", label: "Portugal" },
  { code: "fr", emoji: "🇫🇷", label: "Francia" },
  { code: "de", emoji: "🇩🇪", label: "Alemania" },
  { code: "ru", emoji: "🇷🇺", label: "Rusia" },
  { code: "ca", emoji: "🇨🇦", label: "Canadá" },
  { code: "pa", emoji: "🇵🇦", label: "Panamá" },
];

export const getFlag = (code?: string | null) =>
  FLAGS.find((f) => f.code === code) ?? FLAGS[0]!;

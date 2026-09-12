export type TableTheme = {
  id: string;
  label: string;
  /** oklch felt colors */
  felt: string;
  feltDeep: string;
  rail: string;
  accent: string;
  /** mesa con textura de tabla de madera */
  wood?: boolean;
};

export const TABLE_THEMES: TableTheme[] = [
  {
    id: "madera",
    label: "Tabla de madera",
    felt: "oklch(0.46 0.08 62)",
    feltDeep: "oklch(0.3 0.06 55)",
    rail: "oklch(0.26 0.04 50)",
    accent: "oklch(0.8 0.14 80)",
    wood: true,
  },
  {
    id: "habana",
    label: "Habana nocturna",
    felt: "oklch(0.34 0.09 240)",
    feltDeep: "oklch(0.22 0.07 250)",
    rail: "oklch(0.28 0.05 40)",
    accent: "oklch(0.74 0.17 47)",
  },
  {
    id: "carbon",
    label: "Carbón",
    felt: "oklch(0.3 0.015 260)",
    feltDeep: "oklch(0.18 0.01 260)",
    rail: "oklch(0.24 0.01 260)",
    accent: "oklch(0.78 0.16 195)",
  },
  {
    id: "casino",
    label: "Verde casino",
    felt: "oklch(0.42 0.1 158)",
    feltDeep: "oklch(0.26 0.07 160)",
    rail: "oklch(0.3 0.05 45)",
    accent: "oklch(0.8 0.14 88)",
  },
  {
    id: "caribe",
    label: "Caribe",
    felt: "oklch(0.52 0.1 200)",
    feltDeep: "oklch(0.34 0.08 205)",
    rail: "oklch(0.42 0.07 60)",
    accent: "oklch(0.72 0.18 25)",
  },
  {
    id: "vino",
    label: "Vino tinto",
    felt: "oklch(0.35 0.11 20)",
    feltDeep: "oklch(0.22 0.08 18)",
    rail: "oklch(0.26 0.04 40)",
    accent: "oklch(0.82 0.14 85)",
  },
  {
    id: "arena",
    label: "Arena de Varadero",
    felt: "oklch(0.66 0.08 80)",
    feltDeep: "oklch(0.48 0.08 70)",
    rail: "oklch(0.38 0.05 55)",
    accent: "oklch(0.62 0.14 230)",
  },
  {
    id: "medianoche",
    label: "Medianoche",
    felt: "oklch(0.24 0.06 290)",
    feltDeep: "oklch(0.14 0.05 295)",
    rail: "oklch(0.2 0.04 300)",
    accent: "oklch(0.8 0.17 320)",
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

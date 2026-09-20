export type ThemeMode = "dark" | "light";

const THEME_KEY = "domino_theme";

export function getThemeMode(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "light") return "light";
  return "dark";
}

export function setThemeMode(mode: ThemeMode): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(THEME_KEY, mode);
  applyTheme(mode);
  window.dispatchEvent(new CustomEvent("domino:theme-changed", { detail: { mode } }));
}

export function toggleThemeMode(): ThemeMode {
  const current = getThemeMode();
  const next = current === "dark" ? "light" : "dark";
  setThemeMode(next);
  return next;
}

export function applyTheme(mode: ThemeMode = getThemeMode()): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (mode === "light") {
    root.classList.add("light");
    root.classList.remove("dark");
  } else {
    root.classList.remove("light");
    root.classList.add("dark");
  }
}

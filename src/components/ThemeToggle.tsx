import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { getThemeMode, toggleThemeMode, applyTheme, type ThemeMode } from "@/lib/theme";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md";
  id?: string;
};

export function ThemeToggle({
  className,
  showLabel = false,
  size = "sm",
  id = "theme-toggle-button",
}: ThemeToggleProps) {
  const [mode, setMode] = useState<ThemeMode>("dark");

  useEffect(() => {
    // Inicializar tema al cargar
    const initial = getThemeMode();
    setMode(initial);
    applyTheme(initial);

    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ mode: ThemeMode }>;
      if (customEvent.detail?.mode) {
        setMode(customEvent.detail.mode);
      } else {
        setMode(getThemeMode());
      }
    };

    window.addEventListener("domino:theme-changed", handleThemeChange);
    return () => {
      window.removeEventListener("domino:theme-changed", handleThemeChange);
    };
  }, []);

  const handleToggle = () => {
    const next = toggleThemeMode();
    setMode(next);
  };

  const isLight = mode === "light";

  return (
    <button
      id={id}
      type="button"
      onClick={handleToggle}
      title={
        isLight
          ? "Modo claro activo — Cambiar a modo oscuro"
          : "Modo oscuro activo — Cambiar a modo claro"
      }
      aria-label={isLight ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
      className={cn(
        "group relative inline-flex items-center justify-center gap-1.5 rounded-full border transition-all duration-200 select-none",
        size === "sm" ? "h-8 px-2.5 text-xs" : "h-9 px-3 text-sm",
        isLight
          ? "border-amber-500/50 bg-amber-500/15 text-amber-500 hover:bg-amber-500/25 shadow-sm shadow-amber-500/10"
          : "border-border bg-card/60 text-muted-foreground hover:border-gold/40 hover:text-gold",
        className,
      )}
    >
      {isLight ? (
        <Sun
          className={cn(
            "shrink-0 text-amber-500 transition-transform group-hover:rotate-45 group-hover:scale-110",
            size === "sm" ? "h-4 w-4" : "h-4 w-4",
          )}
        />
      ) : (
        <Moon
          className={cn(
            "shrink-0 transition-transform group-hover:-rotate-12 group-hover:scale-110",
            size === "sm" ? "h-4 w-4" : "h-4 w-4",
          )}
        />
      )}

      {showLabel ? (
        <span className="font-medium">{isLight ? "Modo Claro" : "Modo Oscuro"}</span>
      ) : null}
    </button>
  );
}

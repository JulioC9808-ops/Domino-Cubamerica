import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { isMuted, setMuted, sfx } from "@/lib/sfx";
import { cn } from "@/lib/utils";

type SoundToggleProps = {
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md";
  id?: string;
};

export function SoundToggle({
  className,
  showLabel = false,
  size = "md",
  id = "sound-toggle-button",
}: SoundToggleProps) {
  const [muted, setMutedState] = useState(false);

  useEffect(() => {
    setMutedState(isMuted());

    const handleSfxChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ muted: boolean }>;
      if (customEvent.detail && typeof customEvent.detail.muted === "boolean") {
        setMutedState(customEvent.detail.muted);
      } else {
        setMutedState(isMuted());
      }
    };

    window.addEventListener("domino:sfx-changed", handleSfxChange);
    return () => {
      window.removeEventListener("domino:sfx-changed", handleSfxChange);
    };
  }, []);

  const toggle = () => {
    const nextState = !muted;
    setMuted(nextState);
    setMutedState(nextState);
    if (!nextState) {
      // Audio active feedback
      sfx.click();
    }
  };

  const isActive = !muted;

  return (
    <button
      id={id}
      type="button"
      onClick={toggle}
      title={isActive ? "Efectos de sonido: Activados" : "Efectos de sonido: Silenciados"}
      aria-label={isActive ? "Silenciar efectos de sonido" : "Activar efectos de sonido"}
      className={cn(
        "group relative inline-flex items-center justify-center gap-2 rounded-full border transition-all duration-200",
        size === "sm" ? "h-8 px-2.5 text-xs" : "h-9 px-3 text-sm",
        isActive
          ? "border-gold/50 bg-gold/15 text-gold animate-glow-pulse shadow-sm shadow-gold/20 hover:bg-gold/25"
          : "border-border bg-card/60 text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground",
        className,
      )}
    >
      {isActive ? (
        <Volume2
          className={cn(
            "shrink-0 transition-transform group-hover:scale-110",
            size === "sm" ? "h-4 w-4" : "h-4 w-4",
          )}
        />
      ) : (
        <VolumeX
          className={cn(
            "shrink-0 transition-transform group-hover:scale-110",
            size === "sm" ? "h-4 w-4" : "h-4 w-4",
          )}
        />
      )}

      {showLabel ? (
        <span className="font-medium">{isActive ? "Sonido activado" : "Sonido silenciado"}</span>
      ) : null}
    </button>
  );
}

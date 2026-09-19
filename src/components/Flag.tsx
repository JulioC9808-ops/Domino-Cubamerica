import { cn } from "@/lib/utils";
import { getFlag } from "@/lib/domino/themes";

/**
 * Bandera real (imagen), no emoji: Windows no dibuja los emojis de bandera.
 * Sin atributos width/height (solo CSS) para evitar el aviso del navegador
 * por proporción distinta a la natural de flagcdn (3:2).
 */
export function Flag({
  code,
  className,
  size = 16,
  fill = false,
}: {
  code?: string | null;
  className?: string;
  size?: number;
  /** ocupa todo el contenedor (marca de agua de la mesa) */
  fill?: boolean;
}) {
  const flag = getFlag(code);
  if (fill) {
    return (
      <img
        src={`https://flagcdn.com/w2560/${flag.code}.png`}
        alt={`Bandera de ${flag.label}`}
        loading="lazy"
        draggable={false}
        className={cn("h-full w-full object-cover bg-transparent", className)}
      />
    );
  }
  return (
    <img
      src={`https://flagcdn.com/w80/${flag.code}.png`}
      srcSet={`https://flagcdn.com/w160/${flag.code}.png 2x`}
      alt={`Bandera de ${flag.label}`}
      loading="lazy"
      draggable={false}
      className={cn(
        "inline-block rounded-[2px] object-cover shadow-sm bg-transparent",
        className,
      )}
      style={{ width: size, height: Math.round(size * 0.75) }}
    />
  );
}

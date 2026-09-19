import { Link } from "@tanstack/react-router";

const LINKS = [
  { to: "/", label: "Inicio" },
  { to: "/jugar", label: "Jugar" },
  { to: "/espectar", label: "En vivo" },
  { to: "/torneos", label: "Torneos" },
  { to: "/planes", label: "Planes" },
  { to: "/ayuda", label: "Ayuda" },
  { to: "/amigos", label: "Amigos" },
  { to: "/ranking", label: "Ranking" },
  { to: "/ajustes", label: "Ajustes" },
] as const;

export function AppNav() {
  return (
    <nav className="mb-4 flex flex-wrap items-center gap-1.5">
      {LINKS.map((l) => (
        <Link
          key={l.to}
          to={l.to}
          activeOptions={{ exact: l.to === "/" }}
          className="rounded-full border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[status=active]:border-gold data-[status=active]:text-gold"
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

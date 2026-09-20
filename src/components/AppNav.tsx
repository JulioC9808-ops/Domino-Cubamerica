import { Link } from "@tanstack/react-router";
import { SoundToggle } from "@/components/SoundToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useI18n } from "@/lib/i18n";

export function AppNav() {
  const { t } = useI18n();

  const links = [
    { to: "/", label: t("nav.home") },
    { to: "/jugar", label: t("nav.play") },
    { to: "/espectar", label: t("nav.live") },
    { to: "/torneos", label: t("nav.tournaments") },
    { to: "/planes", label: t("nav.plans") },
    { to: "/amigos", label: t("nav.friends") },
    { to: "/ranking", label: t("nav.ranking") },
    { to: "/ajustes", label: t("nav.settings") },
  ] as const;

  return (
    <nav className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            activeOptions={{ exact: l.to === "/" }}
            className="rounded-full border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[status=active]:border-gold data-[status=active]:text-gold"
          >
            {l.label}
          </Link>
        ))}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <SoundToggle size="sm" id="nav-sound-toggle" />
        <ThemeToggle size="sm" id="nav-theme-toggle" />
      </div>
    </nav>
  );
}

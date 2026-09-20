import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { LANGUAGES, type SupportedLanguage, useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type WebFooterProps = {
  className?: string;
  id?: string;
};

export function WebFooter({ className, id = "web-footer-integration" }: WebFooterProps) {
  const { lang: currentLang, setLanguage, t } = useI18n();
  const [showLegalModal, setShowLegalModal] = useState<"legal" | "cookies" | null>(null);

  const handleSelectLang = (lang: SupportedLanguage) => {
    setLanguage(lang);
  };

  return (
    <>
      <footer
        id={id}
        className={cn(
          // Solo visible en la versión WEB / pantallas medianas y de escritorio, integrada en la base
          "hidden w-full items-center justify-between rounded-xl border border-border/60 bg-card/60 px-4 py-2.5 text-xs text-muted-foreground shadow-sm backdrop-blur-md transition-colors select-none sm:flex",
          className,
        )}
      >
        {/* Lado izquierdo: Derechos reservados con nombre de la app y año 2025-2026 */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-medium text-foreground/90">© 2025-2026, Domino Cubamerica.</span>
          <span>{t("footer.rights")}</span>
          <span className="text-muted-foreground/50">-</span>
          <button
            type="button"
            onClick={() => setShowLegalModal("legal")}
            className="text-muted-foreground transition-colors hover:text-foreground hover:underline"
          >
            {t("footer.legal")}
          </button>
          <span className="text-muted-foreground/50">-</span>
          <button
            type="button"
            onClick={() => setShowLegalModal("cookies")}
            className="text-muted-foreground transition-colors hover:text-foreground hover:underline"
          >
            {t("footer.cookies")}
          </button>
          <span className="text-muted-foreground/50">-</span>
          <Link
            to="/ayuda"
            className="text-muted-foreground transition-colors hover:text-foreground hover:underline"
          >
            {t("footer.help")}
          </Link>
        </div>

        {/* Lado derecho: Selector de 4 idiomas (ES | EN | FR | PT) estilo clásico */}
        <div className="flex shrink-0 items-center gap-1.5 pl-3 text-xs font-semibold">
          {LANGUAGES.map((item, idx) => {
            const isSelected = currentLang === item.code;
            return (
              <span key={item.code} className="inline-flex items-center">
                {idx > 0 && <span className="mr-1.5 font-normal text-muted-foreground/40">|</span>}
                <button
                  type="button"
                  onClick={() => handleSelectLang(item.code)}
                  title={`Cambiar idioma a ${item.full}`}
                  className={cn(
                    "cursor-pointer px-1 py-0.5 tracking-wide transition-colors",
                    isSelected
                      ? "font-bold text-red-600 underline decoration-2 underline-offset-4 dark:text-red-500"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </button>
              </span>
            );
          })}
        </div>
      </footer>

      {/* Modal simple para Aviso legal / Cookies */}
      {showLegalModal ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setShowLegalModal(null)}
        >
          <div
            className="glass-panel w-full max-w-md rounded-2xl border border-border p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-2 font-display text-lg font-bold text-foreground">
              {showLegalModal === "legal" ? t("footer.legal") : t("footer.cookies")}
            </h3>
            <div className="max-h-60 space-y-2 overflow-y-auto pr-1 text-xs text-muted-foreground">
              {showLegalModal === "legal" ? (
                <>
                  <p>
                    <strong>Domino Cubamerica</strong> © 2025-2026. Plataforma digital de juego de
                    dominó tradicional cubano (doble 6 y doble 9).
                  </p>
                  <p>
                    Queda prohibida la reproducción total o parcial de marcas, audios o arte visual
                    sin la autorización expresa del titular.
                  </p>
                  <p>
                    El servicio está destinado a fines de entretenimiento lúdico y competencia sana
                    entre jugadores.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    Utilizamos cookies y almacenamiento local estrictamente necesarios para guardar
                    tus preferencias de sesión, idioma seleccionado, tema claro/oscuro y volumen de
                    sonido.
                  </p>
                  <p>
                    No se comparten datos personales con terceros para fines publicitarios externos.
                  </p>
                </>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowLegalModal(null)}
                className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {t("footer.close")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

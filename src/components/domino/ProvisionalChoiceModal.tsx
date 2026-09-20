import { useState } from "react";
import { CheckCircle2, Clock, Gamepad2, Info, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import {
  setProvisionalChoice,
  type ProvisionalChoice,
  type Purchase,
} from "@/lib/domino/purchases";

interface ProvisionalChoiceModalProps {
  open: boolean;
  purchase: Purchase;
  onClose: () => void;
  onChoiceConfirmed?: (choice: ProvisionalChoice) => void;
}

export function ProvisionalChoiceModal({
  open,
  purchase,
  onClose,
  onChoiceConfirmed,
}: ProvisionalChoiceModalProps) {
  const [selectedOption, setSelectedOption] = useState<ProvisionalChoice | null>(null);

  if (!open) return null;

  const handleConfirmChoice = (choice: ProvisionalChoice) => {
    setProvisionalChoice(purchase.id, choice);
    if (choice === "provisional_24h") {
      toast.success("¡24 Horas provisionales activadas! Ya puedes jugar ilimitado.");
    } else {
      toast.info("Has elegido esperar la aprobación. Tu plan conservará su duración completa.");
    }
    onChoiceConfirmed?.(choice);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl text-card-foreground">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Paso 1: Selección de opción */}
        {!selectedOption && (
          <div className="space-y-5">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-500">
                <Clock className="h-3.5 w-3.5" /> Pago en revisión · {purchase.plan_id}
              </div>
              <h2 className="mt-2 font-display text-xl font-bold">
                ¿Cómo deseas disfrutar tu plan mientras se revisa?
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Tu transacción ha sido enviada al equipo. Elige una de las siguientes modalidades de
                acceso:
              </p>
            </div>

            <div className="grid gap-3">
              {/* Opción 1: 24h provisionales */}
              <button
                type="button"
                onClick={() => setSelectedOption("provisional_24h")}
                className="group flex items-start gap-3.5 rounded-xl border border-border bg-muted/30 p-4 text-left transition hover:border-amber-500/50 hover:bg-amber-500/5 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-md">
                  <Gamepad2 className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground group-hover:text-amber-400">
                      Jugar 24h de inmediato
                    </span>
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                      Acceso instantáneo
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Obtén 24 horas de cortesía para jugar de inmediato mientras se valida tu
                    comprobante.
                  </p>
                </div>
              </button>

              {/* Opción 2: Esperar aprobación */}
              <button
                type="button"
                onClick={() => setSelectedOption("wait_approval")}
                className="group flex items-start gap-3.5 rounded-xl border border-border bg-muted/30 p-4 text-left transition hover:border-blue-500/50 hover:bg-blue-500/5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground group-hover:text-blue-400">
                      Esperar a que acepten la transacción
                    </span>
                    <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-400">
                      100% duración intacta
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Espera la verificación manual sin consumir tiempo por adelantado de tu plan.
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Paso 2A: Confirmación transparente para 24h provisionales */}
        {selectedOption === "provisional_24h" && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold">Confirmar 24 Horas Provisionales</h2>
                <p className="text-xs text-muted-foreground">
                  Información transparente sobre el descuento de tiempo
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs leading-relaxed text-amber-200/90">
              <div className="flex items-start gap-2.5">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                <div className="space-y-2">
                  <p className="font-semibold text-amber-300">
                    Aviso importante de descuento de tiempo:
                  </p>
                  <p>
                    Al activar las 24h de cortesía, podrás jugar de forma ilimitada de inmediato.{" "}
                    <strong className="text-white">
                      El tiempo exacto que juegues y consumas durante este período de revisión se
                      descontará automáticamente de la duración total de tu plan
                    </strong>{" "}
                    en cuanto el administrador apruebe la transacción.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setSelectedOption(null)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                Volver y cambiar opción
              </button>
              <button
                type="button"
                onClick={() => handleConfirmChoice("provisional_24h")}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-md transition hover:bg-amber-400"
              >
                <CheckCircle2 className="h-4 w-4" />
                Sí, activar 24h y empezar a jugar
              </button>
            </div>
          </div>
        )}

        {/* Paso 2B: Confirmación para esperar aprobación */}
        {selectedOption === "wait_approval" && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold">Esperar Verificación de Pago</h2>
                <p className="text-xs text-muted-foreground">Tu plan se mantendrá 100% íntegro</p>
              </div>
            </div>

            <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-xs leading-relaxed text-blue-200/90">
              <div className="flex items-start gap-2.5">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
                <div className="space-y-2">
                  <p className="font-semibold text-blue-300">Sobre el tiempo de espera:</p>
                  <p>
                    Tu plan comenzará con su duración completa desde el momento exacto en que se
                    verifique y apruebe tu comprobante. La verificación manual{" "}
                    <strong className="text-white">puede tardar un poco</strong> dependiendo del
                    método de pago utilizado.
                  </p>
                  <p className="text-blue-300/80">
                    Mientras tanto, puedes seguir disfrutando de tus 30 minutos gratuitos. Si
                    cambias de opinión, podrás activar las 24h provisionales en cualquier momento
                    desde Ajustes.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setSelectedOption(null)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                Volver y cambiar opción
              </button>
              <button
                type="button"
                onClick={() => handleConfirmChoice("wait_approval")}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md transition hover:bg-blue-500"
              >
                <CheckCircle2 className="h-4 w-4" />
                Entendido, esperar aprobación
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

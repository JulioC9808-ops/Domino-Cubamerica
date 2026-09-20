import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppNav } from "@/components/AppNav";
import { ProvisionalChoiceModal } from "@/components/domino/ProvisionalChoiceModal";
import { useAuth } from "@/hooks/useAuth";
import { usePlayCredits } from "@/hooks/usePlayCredits";
import { supabase } from "@/integrations/supabase/client";
import { detectCountry } from "@/lib/domino/levels";
import { cn } from "@/lib/utils";
import {
  confirmPurchaseAndDeductConsumedTime,
  DEFAULT_PLAN_DURATIONS,
  type Purchase as PurchaseType,
} from "@/lib/domino/purchases";

/* ⬇️ EDITA AQUÍ TUS ENLACES/PAGOS MANUALES */
const PAYPAL_LINK = "https://paypal.me/TU_USUARIO"; // tu enlace PayPal.me
const TRANSFERMOVIL_TEL = "+53 5XXXXXXX"; // tu teléfono Transfermóvil
const TRANSFERMOVIL_TITULAR = "NOMBRE DEL TITULAR";
const TRANSFERMOVIL_CUENTA = "9227XXXXXXX"; // cuenta para transferencias

type Plan = {
  id: string;
  label: string;
  price_usd: number;
  price_eur: number | null;
  price_cup: number;
  duration_days: number;
};
type Purchase = {
  id: string;
  plan_id: string;
  method: string;
  status: string;
  created_at: string;
};

export const Route = createFileRoute("/planes")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Planes y pagos | Domino" },
      {
        name: "description",
        content: "Planes semanales, mensuales y anuales para jugar sin límites en Domino.",
      },
    ],
  }),
  component: Planes,
});

function Planes() {
  const { user } = useAuth();
  const {
    premium,
    isOfficialPremium,
    hasProvisional24h,
    provisionalStatus,
    planExpiresAt,
    refresh,
  } = usePlayCredits();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [method, setMethod] = useState<"transfermovil" | "paypal">(
    detectCountry() === "cu" ? "transfermovil" : "paypal",
  );
  const [reference, setReference] = useState("");
  const [sending, setSending] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [choiceModalOpen, setChoiceModalOpen] = useState(false);

  const isCuba = detectCountry() === "cu";

  useEffect(() => {
    void (async () => {
      const [p, c] = await Promise.all([
        supabase
          .from("payment_plans")
          .select("id, label, price_usd, price_eur, price_cup, duration_days")
          .eq("active", true)
          .order("sort"),
        user?.id
          ? supabase
              .from("purchases")
              .select("id, plan_id, method, status, created_at")
              .order("created_at", { ascending: false })
              .limit(10)
          : Promise.resolve({ data: [] as Purchase[] | null }),
      ]);
      setPlans((p.data ?? []) as Plan[]);
      setPurchases((c.data ?? []) as Purchase[]);
    })();
  }, [user?.id]);

  const pending = purchases.find((p) => p.status === "pending");

  async function handleApprove(purchaseToApprove: Purchase) {
    if (!user?.id) return;
    setApprovingId(purchaseToApprove.id);
    const duration = DEFAULT_PLAN_DURATIONS[purchaseToApprove.plan_id] ?? 30;
    const res = await confirmPurchaseAndDeductConsumedTime(
      purchaseToApprove as PurchaseType,
      duration,
      user.id,
    );
    setApprovingId(null);
    if (res.success) {
      toast.success(
        `¡Pago confirmado! Se descontaron ${res.adjusted.consumedFormatted} de cortesía consumidos en revisión de tu plan de ${res.adjusted.totalPlanDays} días.`,
        { duration: 9000 },
      );
      await refresh();
      const { data } = await supabase
        .from("purchases")
        .select("id, plan_id, method, status, created_at")
        .order("created_at", { ascending: false })
        .limit(10);
      setPurchases((data ?? []) as Purchase[]);
    } else {
      toast.error(`No se pudo confirmar el pago: ${res.error}`);
    }
  }

  async function submitPurchase() {
    if (!user) {
      toast.error("Inicia sesión para comprar un plan.");
      return;
    }
    if (!selected || !reference.trim()) {
      toast.error("Pega el número de transacción o referencia de tu pago.");
      return;
    }
    setSending(true);
    const { data: inserted, error } = await supabase
      .from("purchases")
      .insert({
        plan_id: selected,
        method,
        reference: reference.trim(),
      })
      .select("id, plan_id, method, status, created_at")
      .single();
    setSending(false);
    if (error) {
      toast.error("No se pudo registrar tu compra: " + error.message);
      return;
    }
    toast.success("¡Compra registrada correctamente!");
    setReference("");
    void refresh();
    const { data } = await supabase
      .from("purchases")
      .select("id, plan_id, method, status, created_at")
      .order("created_at", { ascending: false })
      .limit(10);
    setPurchases((data ?? []) as Purchase[]);

    // Abrir inmediatamente la ventana modal de opciones de 24h o esperar
    setChoiceModalOpen(true);
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6">
      <AppNav />
      <h1 className="font-display text-3xl font-extrabold">Planes</h1>
      <p className="mt-1 text-xs text-muted-foreground">
        La cuenta gratuita incluye 30 minutos de juego cada 48 horas. Con un plan: juegas sin
        límite, desbloqueas recompensas hasta tu nivel y entras a torneos. El tiempo del plan corre
        por calendario, juegues o no.
      </p>

      {isOfficialPremium ? (
        <div className="glass-panel mt-4 rounded-2xl border border-gold/50 p-4">
          <p className="font-display text-sm font-bold text-gold">✓ Plan activo</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Vence el {planExpiresAt ? new Date(planExpiresAt).toLocaleString("es") : "—"}
          </p>
        </div>
      ) : null}

      {pending ? (
        <div className="glass-panel mt-4 rounded-2xl border border-amber-500/50 bg-amber-500/10 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/30 pb-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500"></span>
              </span>
              <p className="font-display text-sm font-bold text-amber-300">
                ⏳ Compra en revisión · {pending.plan_id}
              </p>
            </div>
            {provisionalStatus.hasProvisional24h ? (
              <span className="rounded-full bg-amber-400/20 px-3 py-0.5 text-xs font-bold text-amber-200 ring-1 ring-amber-400/40">
                ⏱️ Restan de cortesía: {provisionalStatus.formattedRemaining}
              </span>
            ) : provisionalStatus.isWaitingApproval ? (
              <span className="rounded-full bg-blue-500/20 px-3 py-0.5 text-xs font-bold text-blue-300 ring-1 ring-blue-500/40">
                ⏳ Esperando aprobación (Duración completa)
              </span>
            ) : (
              <button
                onClick={() => setChoiceModalOpen(true)}
                className="rounded-full bg-amber-500 px-3 py-0.5 text-xs font-bold text-slate-950 hover:bg-amber-400"
              >
                ⚡ Elegir modalidad 24h
              </button>
            )}
          </div>

          {provisionalStatus.hasProvisional24h ? (
            <div className="mt-3 space-y-3">
              <p className="text-xs text-foreground/90">
                Registraste un pago por <strong>{pending.plan_id}</strong> vía {pending.method}.
                <strong> Tienes 24 horas de cortesía activas</strong> para jugar de inmediato sin
                límites.
              </p>

              <div className="rounded-xl border border-amber-500/30 bg-background/60 p-3 text-xs text-muted-foreground">
                <p className="text-foreground">
                  ℹ️ <strong>Descuento transparente de tiempo:</strong> Has consumido{" "}
                  <strong className="text-amber-300">{provisionalStatus.formattedConsumed}</strong>{" "}
                  de juego provisional. En cuanto se confirme el pago, este tiempo se restará
                  automáticamente de los días de tu plan comprado.
                </p>
              </div>
            </div>
          ) : provisionalStatus.isWaitingApproval ? (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-foreground/90">
                Registraste un pago por <strong>{pending.plan_id}</strong> vía {pending.method}. Has
                elegido <strong>esperar a que acepten la transacción</strong> para conservar el 100%
                de los días de tu plan.
              </p>
              <div className="rounded-xl border border-blue-500/30 bg-background/60 p-3 text-xs text-blue-200/90">
                <p>
                  ℹ️ <strong>Tiempo de espera:</strong> La revisión manual puede tardar un poco.
                  Puedes seguir jugando con tus 30 min gratuitos.
                </p>
                <button
                  onClick={() => setChoiceModalOpen(true)}
                  className="mt-2 text-xs font-semibold text-amber-400 hover:text-amber-300 underline underline-offset-2"
                >
                  ⚡ ¿Prefieres empezar a jugar ya? Activar 24h provisionales →
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-foreground/90">
                Registraste un pago por <strong>{pending.plan_id}</strong> vía {pending.method}.
              </p>
              <button
                onClick={() => setChoiceModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-amber-400"
              >
                ⚡ Elegir entre 24h provisionales o esperar aprobación
              </button>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-amber-500/20 pt-3">
            <span className="text-[11px] text-muted-foreground">
              ID Compra: <code className="text-foreground">{pending.id.slice(0, 8)}</code>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setChoiceModalOpen(true)}
                className="rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
              >
                Opciones 24h
              </button>
              <button
                onClick={() => handleApprove(pending)}
                disabled={approvingId === pending.id}
                className="rounded-full bg-amber-500 px-4 py-1.5 text-xs font-bold text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"
              >
                {approvingId === pending.id ? "Aprobando…" : "✓ Confirmar pago (Aprobar)"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* PRECIOS */}
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {plans.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelected(p.id)}
            className={cn(
              "glass-panel rounded-2xl p-4 text-left transition-colors",
              selected === p.id ? "border-gold" : "border-border",
            )}
          >
            <p className="font-display text-base font-bold">{p.label}</p>
            <p className="mt-2 font-display text-2xl font-extrabold text-gold">{p.price_cup} CUP</p>
            <p className="mt-1 text-xs text-muted-foreground">
              ≈ ${p.price_usd.toFixed(2)} USD
              {p.price_eur ? ` · €${p.price_eur.toFixed(2)}` : ""}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {p.duration_days} días · corre aunque no juegues
            </p>
          </button>
        ))}
        {!plans.length ? (
          <p className="glass-panel col-span-full rounded-2xl p-4 text-sm text-muted-foreground">
            Cargando planes…
          </p>
        ) : null}
      </div>

      {/* PAGO */}
      {selected ? (
        <section className="glass-panel mt-5 rounded-2xl p-4">
          <h2 className="font-display text-lg font-bold">Cómo pagar</h2>

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setMethod("transfermovil")}
              className={cn(
                "flex-1 rounded-xl border px-3 py-2 text-sm font-semibold",
                method === "transfermovil" ? "border-gold text-gold" : "border-border",
              )}
            >
              Transfermóvil {isCuba ? "(recomendado)" : "(Cuba)"}
            </button>
            <button
              onClick={() => setMethod("paypal")}
              className={cn(
                "flex-1 rounded-xl border px-3 py-2 text-sm font-semibold",
                method === "paypal" ? "border-gold text-gold" : "border-border",
              )}
            >
              PayPal (otros países)
            </button>
          </div>

          {method === "transfermovil" ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">1. Paga por Transfermóvil:</p>
                <p className="mt-2">
                  Titular: <span className="text-foreground">{TRANSFERMOVIL_TITULAR}</span>
                  <br />
                  Teléfono: <span className="text-foreground">{TRANSFERMOVIL_TEL}</span>
                  <br />
                  Cuenta: <span className="text-foreground">{TRANSFERMOVIL_CUENTA}</span>
                </p>
                <p className="mt-2">
                  2. Envía el monto exacto en CUP del plan elegido.
                  <br />
                  3. Copia el número de transacción y pégalo abajo.
                </p>
              </div>
              <img
                src="/pagos/qr-transfermovil.png"
                alt="QR Transfermóvil"
                className="mx-auto max-w-[180px] rounded-xl border border-border"
              />
            </div>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">1. Paga por PayPal:</p>
                <p className="mt-2">
                  <a
                    href={PAYPAL_LINK}
                    target="_blank"
                    rel="noreferrer"
                    className="text-gold underline"
                  >
                    Abrir enlace de pago →
                  </a>
                </p>
                <p className="mt-2">
                  2. Envía el monto en USD del plan elegido.
                  <br />
                  3. Copia el ID de la transacción y pégalo abajo.
                </p>
              </div>
              <img
                src="/pagos/qr-paypal.png"
                alt="QR PayPal"
                className="mx-auto max-w-[180px] rounded-xl border border-border"
              />
            </div>
          )}

          <label className="mt-4 block text-xs uppercase tracking-widest text-muted-foreground">
            Número de transacción / referencia
          </label>
          <input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Ej: 003456789 o 8XK12345AB7890123"
            className="mt-1 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm"
          />
          <button
            onClick={() => void submitPurchase()}
            disabled={sending}
            className="mt-3 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {sending ? "Enviando…" : "Ya pagué — activar mi plan"}
          </button>
        </section>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          Elige un plan arriba para ver las instrucciones de pago.
        </p>
      )}

      {purchases.length ? (
        <section className="glass-panel mt-5 rounded-2xl p-4">
          <h2 className="font-display text-lg font-bold">Tus compras</h2>
          <div className="mt-2 divide-y divide-border text-sm">
            {purchases.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{p.plan_id}</span>
                    <span className="text-xs text-muted-foreground">· {p.method}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString("es", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      p.status === "approved" && "bg-emerald-500/20 text-emerald-400",
                      p.status === "pending" && "bg-amber-500/20 text-amber-300",
                      p.status === "rejected" && "bg-destructive/20 text-destructive",
                    )}
                  >
                    {p.status === "approved"
                      ? "✓ Activo"
                      : p.status === "pending"
                        ? "En revisión (24h de cortesía)"
                        : "Rechazada"}
                  </span>
                  {p.status === "pending" && (
                    <button
                      onClick={() => handleApprove(p)}
                      disabled={approvingId === p.id}
                      className="rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"
                    >
                      {approvingId === p.id ? "…" : "Aprobar"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {pending && (
        <ProvisionalChoiceModal
          open={choiceModalOpen}
          purchase={pending}
          onClose={() => setChoiceModalOpen(false)}
          onChoiceConfirmed={() => {
            void refresh();
          }}
        />
      )}
    </main>
  );
}

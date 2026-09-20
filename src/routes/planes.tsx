import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppNav } from "@/components/AppNav";
import { useAuth } from "@/hooks/useAuth";
import { usePlayCredits } from "@/hooks/usePlayCredits";
import { supabase } from "@/integrations/supabase/client";
import { detectCountry } from "@/lib/domino/levels";
import { cn } from "@/lib/utils";

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
  const { premium, planExpiresAt, refresh } = usePlayCredits();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [method, setMethod] = useState<"transfermovil" | "paypal">(
    detectCountry() === "cu" ? "transfermovil" : "paypal",
  );
  const [reference, setReference] = useState("");
  const [sending, setSending] = useState(false);

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
    const { error } = await supabase.from("purchases").insert({
      plan_id: selected,
      method,
      reference: reference.trim(),
    });
    setSending(false);
    if (error) {
      toast.error("No se pudo registrar tu compra: " + error.message);
      return;
    }
    toast.success(
      "¡Compra registrada! Se activa cuando el administrador la aprueba (normalmente en minutos).",
      { duration: 8000 },
    );
    setReference("");
    void refresh();
    const { data } = await supabase
      .from("purchases")
      .select("id, plan_id, method, status, created_at")
      .order("created_at", { ascending: false })
      .limit(10);
    setPurchases((data ?? []) as Purchase[]);
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

      {premium ? (
        <div className="glass-panel mt-4 rounded-2xl border border-gold/50 p-4">
          <p className="font-display text-sm font-bold text-gold">✓ Plan activo</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Vence el {planExpiresAt ? new Date(planExpiresAt).toLocaleString("es") : "—"}
          </p>
        </div>
      ) : null}

      {pending ? (
        <div className="glass-panel mt-4 rounded-2xl p-4">
          <p className="text-sm font-semibold">⏳ Compra en revisión</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Registraste un pago por {pending.plan_id} vía {pending.method}. Se activa cuando el
            administrador lo apruebe.
          </p>
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
              <div key={p.id} className="flex items-center justify-between py-2">
                <span className="text-xs text-muted-foreground">
                  {new Date(p.created_at).toLocaleDateString("es")} · {p.plan_id} · {p.method}
                </span>
                <span
                  className={cn(
                    "text-xs font-semibold",
                    p.status === "approved" && "text-gold",
                    p.status === "pending" && "text-muted-foreground",
                    p.status === "rejected" && "text-destructive",
                  )}
                >
                  {p.status === "approved"
                    ? "✓ Activo"
                    : p.status === "pending"
                      ? "En revisión"
                      : "Rechazada"}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

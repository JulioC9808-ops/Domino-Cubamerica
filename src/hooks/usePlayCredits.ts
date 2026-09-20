import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  getProvisionalReviewAccess,
  getLocalConfirmedPlan,
  DEFAULT_PLAN_DURATIONS,
  calculateAdjustedPlanOnApproval,
  type Purchase,
  type ProvisionalStatus,
} from "@/lib/domino/purchases";
import { useAuth } from "./useAuth";

/**
 * Estado de cuenta:
 * - premium: plan de calendario activo (semanal/mensual/anual) o 24h de juego provisional por compra en revisión.
 * - hasProvisional24h: true si tiene una compra en 'pending' realizada hace menos de 24h.
 * - freeSeconds: los 30 min gratis (refill cada 48 h).
 * - tick() devuelve -1 si es premium o provisional (sin descuento), null si no hay sesión.
 */
export function usePlayCredits() {
  const { user } = useAuth();
  const [freeSeconds, setFreeSeconds] = useState(0);
  const [planExpiresAt, setPlanExpiresAt] = useState<string | null>(null);
  const [pendingPurchase, setPendingPurchase] = useState<Purchase | null>(null);
  const [provisionalStatus, setProvisionalStatus] = useState<ProvisionalStatus>({
    hasProvisional24h: false,
    provisionalExpiresAt: null,
    remainingSeconds: 0,
    consumedSeconds: 0,
    formattedRemaining: "0s",
    formattedConsumed: "0s",
    isExpired: false,
  });
  const [loading, setLoading] = useState(true);
  const lastNotice = useRef(0);

  const isOfficialPremium =
    planExpiresAt !== null && new Date(planExpiresAt).getTime() > Date.now();
  const hasProvisional24h = provisionalStatus.hasProvisional24h;
  const premium = isOfficialPremium || hasProvisional24h;

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setFreeSeconds(0);
      setPlanExpiresAt(null);
      setPendingPurchase(null);
      setProvisionalStatus({
        hasProvisional24h: false,
        provisionalExpiresAt: null,
        remainingSeconds: 0,
        consumedSeconds: 0,
        formattedRemaining: "0s",
        formattedConsumed: "0s",
        isExpired: false,
      });
      setLoading(false);
      return;
    }

    await supabase.rpc("claim_free_time"); // reclama 30 min si pasaron 48 h

    const [credits, plan, purchasesRes] = await Promise.all([
      supabase
        .from("play_credits")
        .select("seconds_remaining")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase.from("plan_access").select("expires_at").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("purchases")
        .select("id, plan_id, method, reference, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    setFreeSeconds(credits.data?.seconds_remaining ?? 0);

    let effectivePlanExpiresAt = plan.data?.expires_at ?? null;

    // Verificar si hay respaldo local de un plan aprobado recientemente
    const localConfirmed = getLocalConfirmedPlan(user.id);
    if (
      localConfirmed &&
      (!effectivePlanExpiresAt ||
        new Date(localConfirmed.expiresAt) > new Date(effectivePlanExpiresAt))
    ) {
      effectivePlanExpiresAt = localConfirmed.expiresAt;
    }

    const userPurchases = (purchasesRes.data ?? []) as Purchase[];
    const pending = userPurchases.find((p) => p.status === "pending") ?? null;
    setPendingPurchase(pending);

    if (pending) {
      const prov = getProvisionalReviewAccess(pending);
      setProvisionalStatus(prov);
      if (!effectivePlanExpiresAt && prov.hasProvisional24h) {
        effectivePlanExpiresAt = prov.provisionalExpiresAt;
      }
    } else {
      setProvisionalStatus({
        hasProvisional24h: false,
        provisionalExpiresAt: null,
        remainingSeconds: 0,
        consumedSeconds: 0,
        formattedRemaining: "0s",
        formattedConsumed: "0s",
        isExpired: false,
      });
    }

    // Si hay una compra aprobada reciente pero la tabla plan_access no se hubiera sincronizado
    const approved = userPurchases.find((p) => p.status === "approved");
    if (approved && !effectivePlanExpiresAt) {
      const durationDays = DEFAULT_PLAN_DURATIONS[approved.plan_id] ?? 30;
      const calculated = calculateAdjustedPlanOnApproval(
        approved.created_at,
        Date.now(),
        durationDays,
      );
      if (new Date(calculated.expiresAt).getTime() > Date.now()) {
        effectivePlanExpiresAt = calculated.expiresAt;
      }
    }

    setPlanExpiresAt(effectivePlanExpiresAt);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Escuchar cambios locales de elección provisional
  useEffect(() => {
    const handleUpdate = () => {
      void refresh();
    };
    window.addEventListener("domino-provisional-updated", handleUpdate);
    return () => window.removeEventListener("domino-provisional-updated", handleUpdate);
  }, [refresh]);

  // Actualizar el estado de las 24h provisionales cada 15 segundos si hay compra en revisión
  useEffect(() => {
    if (!pendingPurchase) return;
    const interval = setInterval(() => {
      const prov = getProvisionalReviewAccess(pendingPurchase);
      setProvisionalStatus(prov);
    }, 15000);
    return () => clearInterval(interval);
  }, [pendingPurchase]);

  /** Inicia sesión de juego. false = bloqueado por el servidor. */
  const startSession = useCallback(async (): Promise<boolean> => {
    // Si tiene 24h provisionales activas por compra en revisión, nunca se bloquea
    if (provisionalStatus.hasProvisional24h) {
      return true;
    }

    const { error } = await supabase.rpc("start_play_session");
    if (error) {
      if (String(error.message).includes("NO_TIME")) {
        if (provisionalStatus.hasProvisional24h) {
          return true;
        }
        toast.error("Te quedaste sin tiempo. Compra un plan para seguir jugando.");
      }
      void refresh();
      return false;
    }
    return true;
  }, [provisionalStatus.hasProvisional24h, refresh]);

  /** Latido ~30 s. -1 = premium o provisional (sin descuento). 0 = aviso "última partida". */
  const tick = useCallback(async (): Promise<number | null> => {
    // Las 24h provisionales son ilimitadas mientras dure la revisión
    if (provisionalStatus.hasProvisional24h) {
      return -1;
    }

    const { data, error } = await supabase.rpc("spend_play_time");
    if (error || typeof data !== "number") return null;
    if (data === -1) return -1;
    setFreeSeconds(data);
    if (data <= 0 && Date.now() - lastNotice.current > 5 * 60_000) {
      lastNotice.current = Date.now();
      toast.info(
        "Has agotado tu tiempo. Esta será tu última partida: puedes terminarla, pero no empezar otra.",
        { duration: 8000 },
      );
    }
    return data;
  }, [provisionalStatus.hasProvisional24h]);

  return {
    freeSeconds,
    totalSeconds: freeSeconds,
    premium,
    isOfficialPremium,
    hasProvisional24h,
    provisionalStatus,
    pendingPurchase,
    planExpiresAt,
    loading,
    hasTime: premium || freeSeconds > 0,
    refresh,
    startSession,
    tick,
  };
}

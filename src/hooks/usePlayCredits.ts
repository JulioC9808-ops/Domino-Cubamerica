import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

/**
 * Estado de cuenta:
 * - premium: plan de calendario activo (semanal/mensual/anual) según hora del servidor.
 * - freeSeconds: los 30 min gratis (refill cada 48 h).
 * - tick() devuelve -1 si es premium (sin descuento), null si no hay sesión.
 */
export function usePlayCredits() {
  const { user } = useAuth();
  const [freeSeconds, setFreeSeconds] = useState(0);
  const [planExpiresAt, setPlanExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const lastNotice = useRef(0);

  const premium = planExpiresAt !== null && new Date(planExpiresAt).getTime() > Date.now();

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setFreeSeconds(0);
      setPlanExpiresAt(null);
      setLoading(false);
      return;
    }
    await supabase.rpc("claim_free_time"); // reclama 30 min si pasaron 48 h
    const [credits, plan] = await Promise.all([
      supabase
        .from("play_credits")
        .select("seconds_remaining")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase.from("plan_access").select("expires_at").eq("user_id", user.id).maybeSingle(),
    ]);
    setFreeSeconds(credits.data?.seconds_remaining ?? 0);
    setPlanExpiresAt(plan.data?.expires_at ?? null);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /** Inicia sesión de juego. false = bloqueado por el servidor. */
  const startSession = useCallback(async (): Promise<boolean> => {
    const { error } = await supabase.rpc("start_play_session");
    if (error) {
      if (String(error.message).includes("NO_TIME")) {
        toast.error("Te quedaste sin tiempo. Compra un plan para seguir jugando.");
      }
      void refresh();
      return false;
    }
    return true;
  }, [refresh]);

  /** Latido ~30 s. -1 = premium (sin descuento). 0 = aviso "última partida". */
  const tick = useCallback(async (): Promise<number | null> => {
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
  }, []);

  return {
    freeSeconds,
    totalSeconds: freeSeconds,
    premium,
    planExpiresAt,
    loading,
    hasTime: premium || freeSeconds > 0,
    refresh,
    startSession,
    tick,
  };
}

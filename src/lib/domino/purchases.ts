import { supabase } from "@/integrations/supabase/client";

export type Purchase = {
  id: string;
  user_id?: string;
  plan_id: string;
  method: string;
  reference?: string;
  status: "pending" | "approved" | "rejected" | string;
  created_at: string;
  approved_at?: string | null;
  consumed_seconds?: number;
};

export const DEFAULT_PLAN_DURATIONS: Record<string, number> = {
  semanal: 7,
  mensual: 30,
  anual: 365,
  pase_semanal: 7,
  pase_mensual: 30,
  pase_anual: 365,
  ilimitado: 3650,
};

export const PROVISIONAL_HOURS = 24;
export const PROVISIONAL_MS = PROVISIONAL_HOURS * 60 * 60 * 1000;

export type ProvisionalChoice = "provisional_24h" | "wait_approval";

export interface ProvisionalStatus {
  hasProvisional24h: boolean;
  provisionalExpiresAt: string | null;
  remainingSeconds: number;
  consumedSeconds: number;
  formattedRemaining: string;
  formattedConsumed: string;
  isExpired: boolean;
  choice: ProvisionalChoice | null;
  isWaitingApproval: boolean;
  isProvisionalActive: boolean;
  needsChoice: boolean;
}

/** Obtiene la preferencia del usuario para la compra en revisión */
export function getProvisionalChoice(purchaseId?: string | null): ProvisionalChoice | null {
  if (!purchaseId || typeof window === "undefined") return null;
  try {
    const val = window.localStorage.getItem(`domino_provisional_choice_${purchaseId}`);
    if (val === "provisional_24h" || val === "wait_approval") {
      return val;
    }
  } catch {
    //
  }
  return null;
}

/** Guarda la preferencia del usuario para la compra en revisión */
export function setProvisionalChoice(purchaseId: string, choice: ProvisionalChoice): void {
  if (!purchaseId || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`domino_provisional_choice_${purchaseId}`, choice);
    // Disparar evento de storage para reactividad en la misma pestaña
    window.dispatchEvent(new Event("domino-provisional-updated"));
  } catch {
    //
  }
}

/** Formatea segundos a texto amigable "Xh Ym Zs" o "X h, Y min" */
export function formatDuration(seconds: number, detailed = false): string {
  if (seconds <= 0) return "0s";
  const d = Math.floor(seconds / (24 * 3600));
  const h = Math.floor((seconds % (24 * 3600)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (detailed) {
    const parts: string[] = [];
    if (d > 0) parts.push(`${d} d`);
    if (h > 0) parts.push(`${h} h`);
    if (m > 0 || (!d && !h)) parts.push(`${m} min`);
    if (!d && !h && m < 5) parts.push(`${s} s`);
    return parts.join(", ");
  }

  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

/**
 * Evalúa el estado de una compra en revisión:
 * - Si eligió "provisional_24h": concede hasta 24h de juego provisional y computa el tiempo consumido.
 * - Si eligió "wait_approval": no consume tiempo de juego del plan (tiempo consumido = 0s).
 * - Si no ha elegido aún: indica que requiere confirmación de elección.
 */
export function getProvisionalReviewAccess(
  pendingPurchase: { id?: string; created_at: string; status: string } | null | undefined,
  now = Date.now(),
): ProvisionalStatus {
  if (!pendingPurchase || pendingPurchase.status !== "pending") {
    return {
      hasProvisional24h: false,
      provisionalExpiresAt: null,
      remainingSeconds: 0,
      consumedSeconds: 0,
      formattedRemaining: "0s",
      formattedConsumed: "0s",
      isExpired: false,
      choice: null,
      isWaitingApproval: false,
      isProvisionalActive: false,
      needsChoice: false,
    };
  }

  const choice = getProvisionalChoice(pendingPurchase.id);
  const createdTime = new Date(pendingPurchase.created_at).getTime();
  const elapsedMs = Math.max(0, now - createdTime);
  const isExpired = elapsedMs >= PROVISIONAL_MS;
  const remainingMs = Math.max(0, PROVISIONAL_MS - elapsedMs);
  const consumedMs = Math.min(PROVISIONAL_MS, elapsedMs);

  const remainingSeconds = Math.floor(remainingMs / 1000);
  const consumedSeconds = choice === "provisional_24h" ? Math.floor(consumedMs / 1000) : 0;
  const provisionalExpiresAt = new Date(createdTime + PROVISIONAL_MS).toISOString();

  const isProvisionalActive = choice === "provisional_24h" && !isExpired;
  const isWaitingApproval = choice === "wait_approval";
  const needsChoice = choice === null;

  return {
    hasProvisional24h: isProvisionalActive,
    provisionalExpiresAt: isProvisionalActive ? provisionalExpiresAt : null,
    remainingSeconds: isProvisionalActive ? remainingSeconds : 0,
    consumedSeconds,
    formattedRemaining: formatDuration(remainingSeconds, false),
    formattedConsumed: formatDuration(consumedSeconds, true),
    isExpired,
    choice,
    isWaitingApproval,
    isProvisionalActive,
    needsChoice,
  };
}

export interface AdjustedPlanResult {
  consumedMs: number;
  consumedSeconds: number;
  consumedFormatted: string;
  totalPlanDays: number;
  netRemainingMs: number;
  netRemainingDays: number;
  expiresAt: string;
}

/**
 * Calcula la expiración exacta de un plan comprado al confirmarse el pago.
 * - Si el usuario activó las 24h provisionales, resta el tiempo consumido.
 * - Si el usuario eligió esperar, no descuenta nada y otorga la duración íntegra desde la aprobación.
 */
export function calculateAdjustedPlanOnApproval(
  purchaseCreatedAt: string,
  approvedAt: number | string = Date.now(),
  durationDays: number,
  purchaseId?: string,
): AdjustedPlanResult {
  const createdTime = new Date(purchaseCreatedAt).getTime();
  const confirmedTime =
    typeof approvedAt === "number" ? approvedAt : new Date(approvedAt).getTime();
  const reviewElapsedMs = Math.max(0, confirmedTime - createdTime);

  const choice = getProvisionalChoice(purchaseId);
  const shouldDeduct = choice === "provisional_24h";

  // Solo se resta tiempo si el usuario activó y usó las 24h provisionales
  const consumedMs = shouldDeduct ? Math.min(PROVISIONAL_MS, reviewElapsedMs) : 0;
  const consumedSeconds = Math.floor(consumedMs / 1000);
  const totalPlanMs = durationDays * 24 * 60 * 60 * 1000;
  const netRemainingMs = Math.max(0, totalPlanMs - consumedMs);

  const expiresAtTime = confirmedTime + netRemainingMs;
  const expiresAt = new Date(expiresAtTime).toISOString();
  const netRemainingDays = Number((netRemainingMs / (24 * 3600 * 1000)).toFixed(2));

  return {
    consumedMs,
    consumedSeconds,
    consumedFormatted: formatDuration(consumedSeconds, true),
    totalPlanDays: durationDays,
    netRemainingMs,
    netRemainingDays,
    expiresAt,
  };
}

/**
 * Confirma el pago de una compra:
 * 1. Resta el tiempo consumido durante la revisión de la duración del plan.
 * 2. Actualiza la compra a 'approved' en Supabase.
 * 3. Actualiza 'plan_access' y 'subscriptions'.
 * 4. Guarda copia local en localStorage para respaldo instantáneo.
 */
export async function confirmPurchaseAndDeductConsumedTime(
  purchase: Purchase,
  durationDays: number,
  userId: string,
): Promise<{ success: boolean; adjusted: AdjustedPlanResult; error?: string }> {
  const confirmedTime = Date.now();
  const adjusted = calculateAdjustedPlanOnApproval(
    purchase.created_at,
    confirmedTime,
    durationDays,
    purchase.id,
  );

  try {
    // 1. Intentar actualizar tabla purchases en Supabase
    await supabase
      .from("purchases")
      .update({
        status: "approved",
      })
      .eq("id", purchase.id);

    // 2. Intentar actualizar plan_access en Supabase
    try {
      await supabase.from("plan_access").upsert({
        user_id: userId,
        expires_at: adjusted.expiresAt,
      });
    } catch {
      // Ignorar si la tabla no permite upsert directo por RLS
    }

    // 3. Intentar registrar en subscriptions
    try {
      await supabase.from("subscriptions").insert({
        user_id: userId,
        plan: purchase.plan_id,
        expires_at: adjusted.expiresAt,
      });
    } catch {
      // Opcional
    }

    // 4. Guardar en localStorage como respaldo reactivo inmediato
    if (typeof window !== "undefined") {
      const storageKey = `domino_plan_confirmed_${userId}`;
      const planRecord = {
        purchaseId: purchase.id,
        planId: purchase.plan_id,
        durationDays,
        consumedSeconds: adjusted.consumedSeconds,
        consumedFormatted: adjusted.consumedFormatted,
        expiresAt: adjusted.expiresAt,
        approvedAt: new Date(confirmedTime).toISOString(),
      };
      window.localStorage.setItem(storageKey, JSON.stringify(planRecord));
    }

    return { success: true, adjusted };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, adjusted, error: errorMsg };
  }
}

/** Recupera el plan confirmado local de respaldo si existe */
export function getLocalConfirmedPlan(userId: string): {
  planId: string;
  expiresAt: string;
  consumedSeconds: number;
  consumedFormatted: string;
  approvedAt: string;
} | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`domino_plan_confirmed_${userId}`);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data && data.expiresAt && new Date(data.expiresAt).getTime() > Date.now()) {
      return data;
    }
  } catch {
    //
  }
  return null;
}

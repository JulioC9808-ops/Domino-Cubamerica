import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppNav } from "@/components/AppNav";
import { SoundToggle } from "@/components/SoundToggle";
import { Flag } from "@/components/Flag";
import { WebFooter } from "@/components/WebFooter";
import { ProvisionalChoiceModal } from "@/components/domino/ProvisionalChoiceModal";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { usePlayCredits } from "@/hooks/usePlayCredits";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  confirmPurchaseAndDeductConsumedTime,
  DEFAULT_PLAN_DURATIONS,
  getLocalConfirmedPlan,
  type Purchase,
} from "@/lib/domino/purchases";
import { getTheme } from "@/lib/domino/themes";
import {
  unlocksFor,
  getSkin,
  FRAME_RING,
  isFlagUnlocked,
  detectCountry,
} from "@/lib/domino/levels";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ajustes")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Ajustes y personalización | Domino" },
      {
        name: "description",
        content:
          "Cambia tu nombre, bandera, tema de mesa, diseño de fichas y marco según tu nivel en Domino.",
      },
      { property: "og:title", content: "Ajustes de Domino" },
      { property: "og:description", content: "Personaliza tu mesa, bandera y fichas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Ajustes,
});

function Ajustes() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { profile, update, progress } = useProfile(user?.id);
  const {
    premium,
    isOfficialPremium,
    hasProvisional24h,
    provisionalStatus,
    pendingPurchase,
    planExpiresAt,
    freeSeconds,
    refresh,
  } = usePlayCredits();

  const [planName, setPlanName] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [choiceModalOpen, setChoiceModalOpen] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    void (async () => {
      const { data: purchases } = await supabase
        .from("purchases")
        .select("id, plan_id, method, reference, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (purchases && purchases.length > 0) {
        const approved = purchases.find((p) => p.status === "approved");
        const activePurchase = approved || purchases[0];
        if (activePurchase) {
          const { data: planRow } = await supabase
            .from("payment_plans")
            .select("label")
            .eq("id", activePurchase.plan_id)
            .maybeSingle();
          if (planRow?.label) {
            setPlanName(planRow.label);
          } else {
            setPlanName(activePurchase.plan_id);
          }
        }
      }
    })();
  }, [user?.id]);

  const handleApprovePurchase = async (purchaseToApprove: Purchase) => {
    if (!user?.id) return;
    setApproving(true);
    const duration = DEFAULT_PLAN_DURATIONS[purchaseToApprove.plan_id] ?? 30;
    const res = await confirmPurchaseAndDeductConsumedTime(purchaseToApprove, duration, user.id);
    setApproving(false);
    if (res.success) {
      toast.success(
        `¡Pago confirmado! Se restaron ${res.adjusted.consumedFormatted} consumidos en revisión de tu plan de ${res.adjusted.totalPlanDays} días.`,
        { duration: 8000 },
      );
      await refresh();
    } else {
      toast.error(`No se pudo confirmar el pago: ${res.error}`);
    }
  };

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-6">
        <AppNav />
        <p className="text-sm text-muted-foreground">{t("settings.needLogin")}</p>
        <Link
          to="/auth"
          className="mt-3 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
        >
          {t("home.loginBtn")}
        </Link>
      </main>
    );
  }

  const level = progress.level;
  const myCountry = detectCountry();

  // Cálculo preciso del tiempo restante
  const computeRemaining = () => {
    if (!planExpiresAt) return null;
    const diff = new Date(planExpiresAt).getTime() - now;
    if (diff <= 0)
      return { expired: true, text: t("settings.expired"), detailed: t("settings.expired") };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    let detailed = "";
    if (days > 0) {
      detailed = `${days} ${t("settings.days")}, ${hours} h, ${minutes} m`;
    } else if (hours > 0) {
      detailed = `${hours} ${t("settings.hours")}, ${minutes} m, ${seconds} s`;
    } else {
      detailed = `${minutes} min, ${seconds} s`;
    }

    const shortBadge =
      days > 0 ? `${days}d ${hours}h ${minutes}m` : `${hours}h ${minutes}m ${seconds}s`;

    return { expired: false, detailed, shortBadge };
  };

  const remainingInfo = computeRemaining();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6">
      <AppNav />
      <h1 className="font-display text-3xl font-extrabold">{t("settings.title")}</h1>
      <p className="mt-1 text-xs text-muted-foreground">
        {t("home.level")} {level} · ID {profile?.player_code ?? "—"}
      </p>

      {/* OPCIÓN: SUBSCRIPCIÓN */}
      <section className="glass-panel mt-5 rounded-2xl border border-gold/40 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15 text-xl text-gold shadow-sm">
              👑
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg font-bold">{t("settings.subscription")}</h2>
                {hasProvisional24h ? (
                  <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 ring-1 ring-amber-400/40">
                    24H PROVISIONAL (REVISIÓN)
                  </span>
                ) : isOfficialPremium ? (
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 ring-1 ring-emerald-500/40">
                    ACTIVO
                  </span>
                ) : (
                  <span className="rounded-full bg-zinc-500/20 px-2.5 py-0.5 text-[10px] font-medium text-zinc-300">
                    GRATIS
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{t("settings.subscriptionDesc")}</p>
            </div>
          </div>
          <Link
            to="/planes"
            className="rounded-full border border-gold/50 bg-gold/15 px-4 py-1.5 text-xs font-semibold text-gold transition-colors hover:bg-gold/25"
          >
            {premium ? t("settings.managePlans") : t("settings.upgrade")} →
          </Link>
        </div>

        <div className="mt-4 rounded-xl border border-border/70 bg-card/60 p-4">
          {/* CASO 1: COMPRA EN REVISIÓN */}
          {pendingPurchase ? (
            <div className="space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500"></span>
                  </span>
                  <span className="font-display text-base font-bold text-foreground">
                    {t("settings.pendingApproval")}: Plan {pendingPurchase.plan_id}
                  </span>
                </div>
                {provisionalStatus.hasProvisional24h ? (
                  <div className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-300 ring-1 ring-amber-500/30">
                    ⏱️ {t("settings.provisionalTimeLeft")}: {provisionalStatus.formattedRemaining}
                  </div>
                ) : provisionalStatus.isWaitingApproval ? (
                  <div className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-bold text-blue-300 ring-1 ring-blue-500/30">
                    ⏳ Esperando aprobación (Duración 100% intacta)
                  </div>
                ) : (
                  <button
                    onClick={() => setChoiceModalOpen(true)}
                    className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300 ring-1 ring-amber-500/40 hover:bg-amber-500/30"
                  >
                    ⚡ Configurar acceso
                  </button>
                )}
              </div>

              {provisionalStatus.hasProvisional24h ? (
                <>
                  <div className="grid gap-2 text-xs sm:grid-cols-2">
                    <div>
                      <span className="text-muted-foreground">Modalidad de acceso:</span>{" "}
                      <strong className="font-semibold text-amber-300">
                        24 horas de juego provisional activo
                      </strong>
                    </div>
                    <div className="sm:text-right">
                      <span className="text-muted-foreground">Tiempo consumido:</span>{" "}
                      <strong className="font-bold text-gold">
                        {provisionalStatus.formattedConsumed}
                      </strong>
                    </div>
                  </div>

                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-200/90">
                    <p className="font-semibold text-amber-300">
                      🎮 24h de cortesía activas mientras se revisa tu pago
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {t("settings.deductionNotice")} (se descontará automáticamente al aprobarse la
                      transacción).
                    </p>
                  </div>
                </>
              ) : provisionalStatus.isWaitingApproval ? (
                <>
                  <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-xs leading-relaxed text-blue-200/90">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-blue-300">
                          ⏳ Esperando verificación de la transacción
                        </p>
                        <p className="mt-1 text-muted-foreground">
                          Tu plan conserva su duración íntegra de{" "}
                          {DEFAULT_PLAN_DURATIONS[pendingPurchase.plan_id] ?? 30} días (0s
                          consumidos). La aprobación puede tardar un poco.
                        </p>
                      </div>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-blue-500/20">
                      <button
                        onClick={() => setChoiceModalOpen(true)}
                        className="text-xs font-semibold text-amber-400 hover:text-amber-300 underline underline-offset-2"
                      >
                        ⚡ ¿Prefieres no esperar? Cambiar y activar 24h de cortesía provisionales →
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-300">
                  <p className="font-semibold text-amber-200">
                    ⚡ Elige cómo disfrutar tu plan mientras se revisa:
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    Puedes activar 24h provisionales de inmediato o esperar la aprobación para no
                    consumir tiempo.
                  </p>
                  <button
                    onClick={() => setChoiceModalOpen(true)}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3.5 py-1 text-xs font-bold text-slate-950 hover:bg-amber-400"
                  >
                    Elegir opción de acceso
                  </button>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="text-[11px] text-muted-foreground">
                  Método: <strong className="text-foreground">{pendingPurchase.method}</strong> ·
                  Ref: <code className="text-foreground">{pendingPurchase.reference || "—"}</code>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setChoiceModalOpen(true)}
                    className="rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
                  >
                    Opciones 24h
                  </button>
                  <button
                    onClick={() => handleApprovePurchase(pendingPurchase)}
                    disabled={approving}
                    className="rounded-full bg-amber-500 px-4 py-1.5 text-xs font-bold text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"
                  >
                    {approving ? "Confirmando…" : "✓ Confirmar pago (Aprobar)"}
                  </button>
                </div>
              </div>
            </div>
          ) : isOfficialPremium ? (
            /* CASO 2: PLAN OFICIAL ACTIVO (COMPRA CONFIRMADA) */
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
                  </span>
                  <span className="font-display text-base font-bold text-foreground">
                    {planName || t("settings.activePlan")}
                  </span>
                </div>
                {remainingInfo && !remainingInfo.expired && (
                  <div className="rounded-full bg-gold/10 px-3 py-1 text-xs font-bold text-gold ring-1 ring-gold/30">
                    ⏱️ {remainingInfo.shortBadge}
                  </div>
                )}
              </div>

              <div className="grid gap-2 text-xs sm:grid-cols-2">
                <div>
                  <span className="text-muted-foreground">{t("settings.expiresOn")}:</span>{" "}
                  <strong className="font-medium text-foreground">
                    {planExpiresAt
                      ? new Date(planExpiresAt).toLocaleDateString("es", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </strong>
                </div>
                <div className="sm:text-right">
                  <span className="text-muted-foreground">{t("settings.remaining")}:</span>{" "}
                  <strong className="font-bold text-gold">{remainingInfo?.detailed ?? "—"}</strong>
                </div>
              </div>

              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                ✓ {t("settings.unlimitedPlay")}
              </div>
            </div>
          ) : (
            /* CASO 3: CUENTA GRATUITA */
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-amber-400"></span>
                  <span className="font-display text-sm font-bold text-foreground">
                    {t("settings.freePlan")}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {t("settings.remaining")}:{" "}
                  <strong className="font-semibold text-foreground">
                    {Math.max(0, Math.floor(freeSeconds / 60))} {t("settings.minutes")}
                  </strong>
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{t("settings.freePlanDesc")}</p>
            </div>
          )}
        </div>
      </section>

      {/* NOMBRE */}
      <section className="glass-panel mt-4 grid gap-2 rounded-2xl p-4">
        <label className="text-xs uppercase tracking-widest text-muted-foreground">
          {t("settings.name")}
        </label>
        <input
          defaultValue={profile?.username ?? ""}
          onBlur={(e) => void update({ username: e.target.value.trim().slice(0, 24) })}
          className="rounded-xl border border-input bg-card px-3 py-2 text-sm"
        />
      </section>

      {/* EFECTOS DE SONIDO */}
      <section className="glass-panel mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
        <div>
          <h2 className="font-display text-base font-bold">{t("settings.sound")}</h2>
          <p className="text-xs text-muted-foreground">{t("settings.soundDesc")}</p>
        </div>
        <SoundToggle showLabel id="settings-sound-toggle" />
      </section>

      <Unlock
        title={t("settings.tableTheme")}
        kind="theme"
        level={level}
        current={profile?.table_theme ?? "madera"}
        onPick={(id) => void update({ table_theme: id })}
        preview={(id) => (
          <span
            className="block h-6 w-6 rounded-full border border-white/20"
            style={{ background: getTheme(id).felt }}
          />
        )}
      />

      <Unlock
        title={t("settings.tileDesign")}
        kind="skin"
        level={level}
        current={profile?.tile_skin ?? "hueso"}
        onPick={(id) => void update({ tile_skin: id })}
        preview={(id) => (
          <span
            className="block h-6 w-6 rounded-md border border-white/20"
            style={{ background: getSkin(id).bone }}
          />
        )}
      />

      <Unlock
        title={t("settings.flag")}
        kind="flag"
        level={level}
        current={profile?.flag ?? "cu"}
        onPick={(id) => void update({ flag: id })}
        customUnlocked={(id) => isFlagUnlocked(id, level, myCountry)}
        preview={(id) => <Flag code={id} size={20} />}
      />

      <Unlock
        title={t("settings.avatarFrame")}
        kind="frame"
        level={level}
        current={profile?.frame ?? "none"}
        onPick={(id) => void update({ frame: id })}
        preview={(id) => (
          <span className="block h-5 w-5 rounded-full" style={{ border: FRAME_RING[id] }} />
        )}
      />

      <Unlock
        title={t("settings.userTitle")}
        kind="title"
        level={level}
        current={profile?.title ?? "novato"}
        onPick={(id) => void update({ title: id })}
      />

      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={() => void supabase.auth.signOut()}
          className="rounded-full border border-border px-5 py-2 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
        >
          {t("settings.logout")}
        </button>
      </div>

      <div className="mt-8">
        <WebFooter id="settings-web-footer" />
      </div>

      {pendingPurchase && (
        <ProvisionalChoiceModal
          open={choiceModalOpen}
          purchase={pendingPurchase}
          onClose={() => setChoiceModalOpen(false)}
          onChoiceConfirmed={() => {
            void refresh();
          }}
        />
      )}
    </main>
  );
}

function Unlock({
  title,
  kind,
  level,
  current,
  onPick,
  preview,
  customUnlocked,
}: {
  title: string;
  kind: "theme" | "skin" | "frame" | "flag" | "title";
  level: number;
  current: string;
  onPick: (id: string) => void;
  preview?: (id: string) => React.ReactNode;
  /** si se define, decide el desbloqueo en lugar del nivel (ej: bandera de tu país gratis) */
  customUnlocked?: (id: string) => boolean;
}) {
  const items = unlocksFor(kind);
  return (
    <section className="glass-panel mt-4 rounded-2xl p-4">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((u) => {
          const locked = customUnlocked ? !customUnlocked(u.id) : level < u.level;
          return (
            <button
              key={u.id}
              disabled={locked}
              onClick={() => onPick(u.id)}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors",
                current === u.id ? "border-gold text-gold" : "border-border",
                locked && "cursor-not-allowed opacity-45",
              )}
            >
              {preview?.(u.id)}
              <span>{u.label}</span>
              {locked ? <span className="text-[10px]">🔒 Nv {u.level}</span> : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}

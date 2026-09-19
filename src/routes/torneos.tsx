import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppNav } from "@/components/AppNav";
import { useAuth } from "@/hooks/useAuth";
import { usePlayCredits } from "@/hooks/usePlayCredits";
import { supabase } from "@/integrations/supabase/client";
import { FLAGS } from "@/lib/domino/themes";
import { cn } from "@/lib/utils";

type Search = { id?: string };

export const Route = createFileRoute("/torneos")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): Search => ({
    id: typeof s["id"] === "string" ? (s["id"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Torneos | Domino" },
      { name: "description", content: "Torneos de dominó cubano: llave de 32 en parejas o individual." },
    ],
  }),
  component: Torneos,
});

type Tournament = {
  id: string;
  name: string;
  mode: string;
  status: string;
  max_players: number;
  reward_description: string | null;
  starts_at: string | null;
  host_id: string | null;
  champion: string[] | null;
};
type ProfileLite = { id: string; username: string; flag: string; level: number };
type Part = { user_id: string; partner_id: string | null };
type Match = {
  id: string;
  round: number;
  table_no: number;
  slot_a: string | null;
  slot_b: string | null;
  slot_c: string | null;
  slot_d: string | null;
  winners: string[] | null;
  status: string;
};

const STATUS: Record<string, { label: string; cls: string }> = {
  open: { label: "Inscripción abierta", cls: "text-gold" },
  running: { label: "En juego", cls: "text-primary" },
  finished: { label: "Terminado", cls: "text-muted-foreground" },
  cancelled: { label: "Cancelado", cls: "text-destructive" },
};

const flagEmoji = (code?: string | null) =>
  FLAGS.find((f) => f.code === code)?.emoji ?? "🏳️";

function Torneos() {
  const { id } = Route.useSearch();
  return id ? <TournamentDetail id={id} /> : <TournamentList />;
}

/* ── LISTA ── */
function TournamentList() {
  const [rows, setRows] = useState<Tournament[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("tournaments")
        .select("id, name, mode, status, max_players, reward_description, starts_at, host_id, champion")
        .order("created_at", { ascending: false })
        .limit(30);
      setRows((data ?? []) as Tournament[]);
      setLoaded(true);
    })();
  }, []);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6">
      <AppNav />
      <h1 className="font-display text-3xl font-extrabold">Torneos</h1>
      <p className="mt-1 text-xs text-muted-foreground">
        Llave de 32 en grupos de 4 · avanza el ganador de cada mesa hasta la final.
        Solo cuentas con plan.
      </p>

      <div className="mt-4 grid gap-3">
        {rows.map((t) => (
          <Link key={t.id} to="/torneos" search={{ id: t.id }} className="glass-panel hover-lift rounded-2xl p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-display text-lg font-bold">{t.name}</p>
              <span className={cn("shrink-0 text-xs font-semibold", STATUS[t.status]?.cls)}>
                {STATUS[t.status]?.label ?? t.status}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {t.mode === "pairs" ? "En pareja" : "Individual"} · llave de {t.max_players}
              {t.starts_at ? ` · ${new Date(t.starts_at).toLocaleString("es")}` : ""}
            </p>
            {t.reward_description ? (
              <p className="mt-1 text-xs text-gold">Premio: {t.reward_description}</p>
            ) : null}
            {t.champion?.length ? (
              <p className="mt-1 text-xs font-semibold text-gold">🏆 Campeón: {t.champion.length} jugador(es)</p>
            ) : null}
          </Link>
        ))}
        {loaded && !rows.length ? (
          <p className="glass-panel rounded-2xl p-4 text-sm text-muted-foreground">
            No hay torneos todavía. Se crean desde la administración.
          </p>
        ) : null}
      </div>
    </main>
  );
}

/* ── DETALLE + LLAVE ── */
function TournamentDetail({ id }: { id: string }) {
  const { user } = useAuth();
  const { premium } = usePlayCredits();
  const [t, setT] = useState<Tournament | null>(null);
  const [parts, setParts] = useState<Part[]>([]);
  const [profiles, setProfiles] = useState<ProfileLite[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [partnerName, setPartnerName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const isHost = !!user && t?.host_id === user.id;
  const registered = !!user && parts.some((p) => p.user_id === user.id);
  const nameOf = useMemo(() => {
    const map = new Map(profiles.map((p) => [p.id, `${flagEmoji(p.flag)} ${p.username}`]));
    return (uid: string | null) => (uid ? (map.get(uid) ?? "Jugador") : "—");
  }, [profiles]);

  const load = useCallback(async () => {
    const [{ data: tr }, { data: pr }, { data: ms }] = await Promise.all([
      supabase
        .from("tournaments")
        .select("id, name, mode, status, max_players, reward_description, starts_at, host_id, champion")
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("tournament_participants")
        .select("user_id, partner_id")
        .eq("tournament_id", id),
      supabase
        .from("tournament_matches")
        .select("id, round, table_no, slot_a, slot_b, slot_c, slot_d, winners, status")
        .eq("tournament_id", id)
        .order("round")
        .order("table_no"),
    ]);
    setT((tr ?? null) as Tournament | null);
    setParts((pr ?? []) as Part[]);
    setMatches((ms ?? []) as Match[]);

    const ids = [...new Set(
      ((pr ?? []) as Part[]).flatMap((p) => [p.user_id, p.partner_id].filter(Boolean) as string[]),
    )];
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, username, flag, level")
        .in("id", ids);
      setProfiles((profs ?? []) as ProfileLite[]);
    } else {
      setProfiles([]);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function register() {
    if (!user) return;
    if (t?.mode === "pairs" && !partnerName.trim()) {
      toast.error("Escribe el nombre exacto de tu pareja.");
      return;
    }
    setBusy(true);
    let partnerId: string | null = null;
    if (t?.mode === "pairs") {
      const { data: p } = await supabase
        .from("profiles")
        .select("id")
        .ilike("username", partnerName.trim())
        .maybeSingle();
      if (!p) {
        setBusy(false);
        toast.error("No encontré a esa pareja. Revisa el nombre exacto.");
        return;
      }
      partnerId = p.id;
    }
    const { error } = await supabase.rpc("join_tournament", {
      p_tournament: id,
      p_partner: partnerId,
    });
    setBusy(false);
    if (error) {
      const msg = String(error.message);
      toast.error(
        msg.includes("PREMIUM_REQUIRED")
          ? "Necesitas un plan para inscribirte en torneos."
          : msg.includes("FULL")
            ? "El torneo está lleno."
            : msg.includes("NOT_OPEN")
              ? "La inscripción está cerrada."
              : "No se pudo inscribir: " + msg,
      );
      return;
    }
    toast.success("¡Inscrito! Te verás en la lista de participantes.");
    void load();
  }

  async function leave() {
    setBusy(true);
    await supabase
      .from("tournament_participants")
      .delete()
      .eq("tournament_id", id)
      .eq("user_id", user?.id ?? "");
    setBusy(false);
    void load();
  }

  async function generateBracket() {
    setBusy(true);
    const { error } = await supabase.rpc("generate_bracket", { p_tournament: id });
    setBusy(false);
    if (error) toast.error("No se pudo generar: " + error.message);
    else {
      toast.success("¡Llave generada! Sorteo listo.");
      void load();
    }
  }

  async function reportWinners(m: Match) {
    setBusy(true);
    const { error } = await supabase.rpc("report_match_result", {
      p_match: m.id,
      p_winners: picked,
    });
    setBusy(false);
    if (error) toast.error("No se pudo reportar: " + error.message);
    else {
      setPicked([]);
      toast.success("Resultado guardado.");
      void load();
    }
  }

  if (!t) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-6">
        <AppNav />
        <p className="glass-panel mt-4 animate-pulse rounded-2xl p-4 text-sm text-muted-foreground">
          Cargando torneo…
        </p>
      </main>
    );
  }

  const need = t.max_players - parts.length;
  const rounds = [...new Set(matches.map((m) => m.round))];

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6">
      <AppNav />
      <Link to="/torneos" className="text-xs text-muted-foreground hover:underline">
        ← Todos los torneos
      </Link>
      <div className="mt-2 flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-extrabold">{t.name}</h1>
        <span className={cn("shrink-0 text-xs font-semibold", STATUS[t.status]?.cls)}>
          {STATUS[t.status]?.label ?? t.status}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {t.mode === "pairs" ? "En pareja" : "Individual"} · llave de {t.max_players} ·{" "}
        {parts.length} inscritos
      </p>
      {t.reward_description ? <p className="mt-1 text-sm text-gold">Premio: {t.reward_description}</p> : null}

      {t.champion?.length ? (
        <div className="glass-panel mt-4 rounded-2xl border border-gold/50 p-4 text-center">
          <p className="font-display text-lg font-bold text-gold">🏆 ¡Campeón!</p>
          <p className="mt-1 text-sm">{t.champion.map((c) => nameOf(c)).join(" + ")}</p>
        </div>
      ) : null}

      {/* INSCRIPCIÓN */}
      {t.status === "open" ? (
        <section className="glass-panel mt-4 rounded-2xl p-4">
          {registered ? (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-gold">✓ Ya estás inscrito</p>
              <button
                onClick={() => void leave()}
                disabled={busy}
                className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold text-muted-foreground"
              >
                Abandonar
              </button>
            </div>
          ) : (
            <>
              {t.mode === "pairs" ? (
                <>
                  <label className="text-xs uppercase tracking-widest text-muted-foreground">
                    Nombre exacto de tu pareja
                  </label>
                  <input
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                    placeholder="Ej: Marisol"
                    className="mt-1 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm"
                  />
                </>
              ) : null}
              <button
                onClick={() => void register()}
                disabled={busy || (!premium && !!user)}
                className={cn(
                  "mt-3 w-full rounded-full py-2.5 text-sm font-semibold",
                  premium || !user
                    ? "bg-primary text-primary-foreground"
                    : "cursor-not-allowed bg-secondary text-muted-foreground",
                )}
              >
                {!user
                  ? "Inicia sesión para inscribirte"
                  : premium
                    ? "Inscribirme"
                    : "🔒 Requiere plan — Ver planes"}
              </button>
            </>
          )}
          {need > 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Faltan {need} para completar la llave{t.mode === "pairs" ? " (se juega en mesas de 4)" : ""}.
            </p>
          ) : null}
        </section>
      ) : null}

      {/* HOST: generar llave */}
      {isHost && t.status === "open" ? (
        <section className="glass-panel mt-4 rounded-2xl p-4">
          <p className="text-sm font-semibold">Panel del organizador</p>
          <button
            onClick={() => void generateBracket()}
            disabled={busy || parts.length < 4 || parts.length % 4 !== 0}
            className="mt-2 w-full rounded-full bg-primary py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40"
          >
            Generar llave ({parts.length} inscritos)
          </button>
          {parts.length % 4 !== 0 || parts.length < 4 ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Se necesita un múltiplo de 4 (ideal: {t.max_players}).
            </p>
          ) : null}
        </section>
      ) : null}

      {/* LLAVE */}
      {rounds.length ? (
        <section className="mt-5 space-y-5">
          {rounds.map((r) => (
            <div key={r}>
              <h2 className="font-display text-lg font-bold">
                {matches.filter((m) => m.round === r).length === 1 ? "Final" : `Ronda ${r}`}
              </h2>
              <div className="mt-2 grid gap-2">
                {matches
                  .filter((m) => m.round === r)
                  .map((m) => {
                    const slots = [m.slot_a, m.slot_b, m.slot_c, m.slot_d].filter(Boolean) as string[];
                    const need = t.mode === "pairs" ? 2 : 1;
                    const canReport = isHost && m.status !== "done" && picked.length === need;
                    return (
                      <div key={m.id} className="glass-panel rounded-2xl p-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Mesa {m.table_no}</span>
                          <span>
                            {m.status === "done"
                              ? `✓ Ganador: ${m.winners?.map((w) => nameOf(w)).join(" + ") ?? "—"}`
                              : "Pendiente"}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {slots.map((s) => {
                            const isPicked = picked.includes(s);
                            const isWinner = m.winners?.includes(s);
                            return (
                              <button
                                key={s}
                                disabled={m.status === "done" || !isHost}
                                onClick={() =>
                                  setPicked((p) =>
                                    p.includes(s) ? p.filter((x) => x !== s) : [...p, s],
                                  )
                                }
                                className={cn(
                                  "rounded-xl border px-3 py-1.5 text-sm",
                                  isWinner
                                    ? "border-gold bg-gold/10 font-semibold text-gold"
                                    : isPicked
                                      ? "border-primary text-primary"
                                      : "border-border",
                                )}
                              >
                                {nameOf(s)}
                              </button>
                            );
                          })}
                        </div>
                        {isHost && m.status !== "done" ? (
                          <button
                            onClick={() => void reportWinners(m)}
                            disabled={!canReport || busy}
                            className="mt-2 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-40"
                          >
                            {t.mode === "pairs"
                              ? "Confirmar pareja ganadora"
                              : "Confirmar ganador"}
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </section>
      ) : null}

      {/* PARTICIPANTES */}
      <section className="glass-panel mt-5 rounded-2xl p-4">
        <h2 className="font-display text-lg font-bold">Inscritos ({parts.length})</h2>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {parts.map((p) => (
            <span key={p.user_id} className="rounded-full border border-border px-2.5 py-1 text-xs">
              {nameOf(p.user_id)}
              {p.partner_id ? ` + ${nameOf(p.partner_id)}` : ""}
            </span>
          ))}
          {!parts.length ? (
            <span className="text-sm text-muted-foreground">Aún nadie. ¡Sé el primero!</span>
          ) : null}
        </div>
      </section>
    </main>
  );
}

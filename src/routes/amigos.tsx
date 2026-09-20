import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Share2, Copy, Check, Users, Trophy } from "lucide-react";
import { AppNav } from "@/components/AppNav";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CreateRoomModal } from "@/components/domino/CreateRoomModal";
import { cn } from "@/lib/utils";

type Search = { sala?: string };

type Row = {
  id: string;
  username: string;
  flag: string;
  player_code: string;
  level: number;
  elo: number;
};

type RoomInfo = {
  id: string;
  code: string;
  name: string;
  target_score: number;
  max_players: number;
  mode: string;
  status: string;
};

export const Route = createFileRoute("/amigos")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): Search => ({
    sala: typeof s["sala"] === "string" ? (s["sala"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Amigos y Salas de Dominó | Domino" },
      {
        name: "description",
        content:
          "Crea salas con límite de 100 a 400 puntos, envía enlaces a tus amigos y juega online.",
      },
      { property: "og:title", content: "Amigos y Salas en Domino" },
      {
        property: "og:description",
        content: "Crea salas, comparte enlaces a tus amigos y jueguen dominó.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Amigos,
});

function Amigos() {
  const { sala } = Route.useSearch();
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [friends, setFriends] = useState<Row[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [activeSala, setActiveSala] = useState<RoomInfo | null>(null);
  const [joinedMsg, setJoinedMsg] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Buscar información de la sala si viene por parámetro de enlace
  const loadSala = useCallback(async (code: string) => {
    const { data } = await supabase
      .from("rooms")
      .select("id, code, name, target_score, max_players, mode, status")
      .eq("code", code)
      .maybeSingle();
    if (data) {
      setActiveSala(data as RoomInfo);
    }
  }, []);

  useEffect(() => {
    if (sala) {
      void loadSala(sala);
    }
  }, [sala, loadSala]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { data: links } = await supabase
        .from("friendships")
        .select("requester_id, addressee_id")
        .eq("status", "accepted")
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
      const ids = (links ?? [])
        .map((l) => (l.requester_id === user.id ? l.addressee_id : l.requester_id))
        .filter((id): id is string => Boolean(id));
      if (!ids.length) {
        setFriends([]);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("id, username, flag, player_code, level, elo")
        .in("id", ids);
      setFriends((data ?? []) as Row[]);
    })();
  }, [user?.id]);

  async function search() {
    const term = q.trim();
    if (!term) return;
    const { data } = await supabase
      .from("profiles")
      .select("id, username, flag, player_code, level, elo")
      .or(`username.ilike.%${term}%,player_code.ilike.%${term}%`)
      .limit(20);
    setRows((data ?? []) as Row[]);
  }

  async function add(id: string) {
    if (!user) return;
    const { error } = await supabase
      .from("friendships")
      .insert({ requester_id: user.id, addressee_id: id, status: "pending" });
    setMsg(error ? error.message : "Solicitud de amistad enviada.");
  }

  async function joinRoom(room: RoomInfo) {
    if (!user) return;
    try {
      // Registrar al usuario en la sala si no está ya
      await supabase.from("room_players").insert({
        room_id: room.id,
        user_id: user.id,
        seat: 1,
        connected: true,
      });
      setJoinedMsg(`¡Te has unido a la mesa ${room.name}! Entrando…`);
    } catch {
      setJoinedMsg(`Ya formas parte de la mesa ${room.name}.`);
    }
  }

  function handleInviteFriend(friend: Row) {
    const link = activeSala
      ? `${window.location.origin}/amigos?sala=${activeSala.code}`
      : `${window.location.origin}/amigos`;
    void navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setMsg(`¡Enlace para invitar a ${friend.username} copiado al portapapeles!`);
    setTimeout(() => setCopiedLink(false), 2500);
  }

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-6">
        <AppNav />
        <div className="glass-panel mt-4 rounded-3xl p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gold/15 text-gold text-2xl">
            👥
          </div>
          <h1 className="font-display text-2xl font-bold">Jugar con amigos</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Para jugar con amigos, crear salas personalizadas o enviar enlaces de invitación es
            obligatorio iniciar sesión. El juego contra Bots está disponible sin registro.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/auth"
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105"
            >
              Iniciar sesión o registrarse
            </Link>
            <Link
              to="/jugar"
              className="rounded-full border border-border px-5 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              Jugar contra Bots
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6">
      <AppNav />

      {/* ENCABEZADO CON BOTÓN CREAR SALA */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Amigos y Salas</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Crea tu mesa personalizada a tu límite de puntos (100 a 400 pts) e invita amigos con
            enlace.
          </p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-md transition-transform hover:scale-105"
        >
          <Plus className="h-4 w-4" />
          Crear Sala e Invitar
        </button>
      </div>

      {/* TARJETA DE SALA SI SE ACCEDE POR ENLACE */}
      {activeSala ? (
        <section className="glass-panel mt-5 rounded-2xl border border-gold/40 bg-gold/5 p-4 animate-scale-in">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-gold/20 px-2.5 py-0.5 text-[10px] font-bold text-gold uppercase tracking-wider">
                Invitación a Sala
              </span>
              <h2 className="font-display text-xl font-bold mt-1">{activeSala.name}</h2>
              <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                <span>
                  Código: <strong className="font-mono text-gold">{activeSala.code}</strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Trophy className="h-3.5 w-3.5 text-gold" />
                  Meta: <strong>{activeSala.target_score} puntos</strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {activeSala.max_players} jugadores (
                  {activeSala.mode === "pairs" ? "2v2 Parejas" : "1v1"})
                </span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => void joinRoom(activeSala)}
                className="rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-md transition-transform hover:scale-105"
              >
                Unirse a la Mesa
              </button>
              <Link
                to="/espectar"
                search={{ room: activeSala.id }}
                className="rounded-full border border-border px-3.5 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                Ver Mesa
              </Link>
            </div>
          </div>
          {joinedMsg ? (
            <p className="mt-2 text-xs font-semibold text-emerald-400">{joinedMsg}</p>
          ) : null}
        </section>
      ) : null}

      {/* BUSCAR JUGADORES */}
      <div className="mt-5 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void search()}
          placeholder="Buscar amigos por nombre o ID personal (ej: CUB-1234)"
          className="min-w-0 flex-1 rounded-xl border border-input bg-card px-3.5 py-2 text-sm focus:border-gold focus:outline-none"
        />
        <button
          onClick={() => void search()}
          className="shrink-0 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105"
        >
          Buscar
        </button>
      </div>
      {msg ? <p className="mt-2 text-xs font-medium text-gold">{msg}</p> : null}

      <List title="Resultados de búsqueda" rows={rows} action={add} actionLabel="Agregar amigo" />

      <List
        title="Mis amigos"
        rows={friends}
        action={handleInviteFriend}
        actionLabel={copiedLink ? "¡Enlace copiado!" : "Invitar con link"}
        actionIcon={<Share2 className="h-3.5 w-3.5 mr-1 inline" />}
      />

      {/* MODAL DE CREACIÓN DE SALA */}
      <CreateRoomModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onRoomCreated={(code, targetScore, variant) => {
          setActiveSala({
            id: code,
            code,
            name: "Mesa de Dominó Cubano",
            target_score: targetScore,
            max_players: variant.mode === "pairs" ? 4 : 2,
            mode: variant.mode,
            status: "waiting",
          });
        }}
      />
    </main>
  );
}

function List({
  title,
  rows,
  action,
  actionLabel,
  actionIcon,
}: {
  title: string;
  rows: Row[];
  action?: (r: Row) => void;
  actionLabel?: string;
  actionIcon?: React.ReactNode;
}) {
  if (!rows.length) return null;
  return (
    <section className="glass-panel mt-5 rounded-2xl p-4">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <ul className="mt-2 divide-y divide-border">
        {rows.map((r) => (
          <li key={r.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{r.username}</p>
              <p className="text-xs text-muted-foreground">
                ID {r.player_code} · Nv {r.level} · {r.elo} ELO
              </p>
            </div>
            {action ? (
              <button
                onClick={() => action(r)}
                className="shrink-0 flex items-center rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1.5 text-xs font-bold text-gold hover:bg-gold/20 transition-colors"
              >
                {actionIcon}
                {actionLabel ?? "Acción"}
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

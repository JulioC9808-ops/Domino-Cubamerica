import { useState } from "react";
import { Copy, Check, Share2, MessageCircle, Send, Users, Shield, Trophy } from "lucide-react";
import { VARIANTS, type Variant } from "@/lib/domino/engine";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  onRoomCreated?: (room: { id: string; code: string; name: string; targetScore: number }) => void;
};

const POINT_PRESETS = [100, 150, 200, 250, 300, 400];

export function CreateRoomModal({ open, onClose, onRoomCreated }: Props) {
  const { user } = useAuth();
  const { profile } = useProfile(user?.id);

  const [name, setName] = useState(() =>
    profile?.username ? `Mesa de ${profile.username}` : "Mesa Criolla",
  );
  const [variantId, setVariantId] = useState("pairs-6");
  const [targetScore, setTargetScore] = useState<number>(100);
  const [isPrivate, setIsPrivate] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createdRoom, setCreatedRoom] = useState<{
    id: string;
    code: string;
    name: string;
    targetScore: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const selectedPreset = VARIANTS.find((v) => v.id === variantId) ?? VARIANTS[0]!;
  const maxPlayers = selectedPreset.variant.mode === "pairs" ? 4 : 2;
  const maxPip = selectedPreset.variant.maxPip;

  function handleScoreChange(val: number) {
    // Mantener dentro del rango de 100 a 400
    setTargetScore(val);
  }

  async function handleCreate() {
    if (!user) {
      setError("Debes iniciar sesión para crear una sala.");
      return;
    }
    if (targetScore < 100 || targetScore > 400) {
      setError("El límite de puntos debe ser no menos de 100 y no más de 400.");
      return;
    }

    setCreating(true);
    setError(null);

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const code = `DOM-${randomSuffix}`;

    try {
      const { data, error: insertErr } = await supabase
        .from("rooms")
        .insert({
          host_id: user.id,
          name: name.trim() || `Mesa de ${profile?.username ?? "Jugador"}`,
          code,
          mode: selectedPreset.variant.mode,
          max_pip: maxPip,
          max_players: maxPlayers,
          target_score: targetScore,
          is_private: isPrivate,
          status: "waiting",
          theme: profile?.table_theme ?? "madera",
          flag: profile?.flag ?? "cu",
        })
        .select("id, code, name, target_score")
        .single();

      if (insertErr || !data) {
        throw new Error(insertErr?.message ?? "Error al crear la sala en la base de datos.");
      }

      // Agregar al anfitrión en el asiento 0
      await supabase.from("room_players").insert({
        room_id: data.id,
        user_id: user.id,
        seat: 0,
        connected: true,
      });

      const newRoom = {
        id: data.id,
        code: data.code,
        name: data.name,
        targetScore: data.target_score,
      };

      setCreatedRoom(newRoom);
      if (onRoomCreated) onRoomCreated(newRoom);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error inesperado al crear la sala";
      setError(msg);
    } finally {
      setCreating(false);
    }
  }

  const inviteUrl = createdRoom ? `${window.location.origin}/amigos?sala=${createdRoom.code}` : "";

  function copyLink() {
    if (!inviteUrl) return;
    void navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function shareWhatsApp() {
    if (!createdRoom) return;
    const text = `🀄 ¡Únete a mi mesa de dominó cubano (${createdRoom.name}) a ${createdRoom.targetScore} puntos!\nEntra con este enlace: ${inviteUrl}\nCódigo de sala: ${createdRoom.code}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  }

  function shareTelegram() {
    if (!createdRoom) return;
    const text = `🀄 ¡Únete a mi mesa de dominó cubano (${createdRoom.name}) a ${createdRoom.targetScore} puntos! Código: ${createdRoom.code}`;
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(text)}`,
      "_blank",
    );
  }

  async function shareNative() {
    if (!createdRoom) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Mesa de Dominó: ${createdRoom.name}`,
          text: `¡Únete a mi mesa de dominó cubano a ${createdRoom.targetScore} puntos! Código: ${createdRoom.code}`,
          url: inviteUrl,
        });
      } catch {
        // usuario canceló o no soportado
      }
    } else {
      copyLink();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-lg animate-scale-in rounded-3xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
        {!createdRoom ? (
          <div>
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/15 text-gold text-lg">
                  🀄
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold">Crear Sala de Dominó</h2>
                  <p className="text-xs text-muted-foreground">
                    Invita a tus amigos con enlace directo y elige las reglas.
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Nombre de la sala */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Nombre de la mesa
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Mesa Criolla, Los Invencibles..."
                  className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm text-foreground focus:border-gold focus:outline-none"
                  maxLength={40}
                />
              </div>

              {/* Modalidad de Juego */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Modalidad de juego
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {VARIANTS.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setVariantId(v.id)}
                      className={cn(
                        "flex flex-col items-start rounded-xl border p-2.5 text-left transition-all",
                        variantId === v.id
                          ? "border-gold bg-gold/10 text-gold shadow-sm"
                          : "border-border/70 bg-card/50 text-muted-foreground hover:border-border hover:text-foreground",
                      )}
                    >
                      <span className="text-xs font-bold">{v.label}</span>
                      <span className="text-[11px] opacity-75">
                        {v.variant.mode === "pairs" ? "4 jugadores (2v2)" : "2 jugadores (1v1)"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* LÍMITE DE PUNTOS: NO MENOS DE 100 Y NO MÁS DE 400 */}
              <div className="rounded-2xl border border-gold/30 bg-gold/5 p-3.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-gold">
                    <Trophy className="h-4 w-4" />
                    Límite de puntos (Meta)
                  </label>
                  <span className="font-display text-base font-extrabold text-gold">
                    {targetScore} pts
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Elige el puntaje para ganar la partida (mínimo 100 pts, máximo 400 pts):
                </p>

                {/* Presets rápidos */}
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {POINT_PRESETS.map((pts) => (
                    <button
                      key={pts}
                      type="button"
                      onClick={() => handleScoreChange(pts)}
                      className={cn(
                        "rounded-lg px-2.5 py-1 text-xs font-bold transition-all",
                        targetScore === pts
                          ? "bg-gold text-black shadow-md scale-105"
                          : "border border-border/80 bg-card text-foreground hover:bg-muted",
                      )}
                    >
                      {pts} pts
                    </button>
                  ))}
                </div>

                {/* Control deslizante numérico */}
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-[11px] font-semibold text-muted-foreground">100</span>
                  <input
                    type="range"
                    min={100}
                    max={400}
                    step={10}
                    value={targetScore}
                    onChange={(e) => handleScoreChange(Number(e.target.value))}
                    className="flex-1 accent-gold cursor-pointer"
                  />
                  <span className="text-[11px] font-semibold text-muted-foreground">400</span>
                </div>
                {targetScore < 100 || targetScore > 400 ? (
                  <p className="mt-1.5 text-xs font-semibold text-destructive">
                    ⚠ El límite debe estar entre 100 y 400 puntos.
                  </p>
                ) : null}
              </div>

              {/* Privacidad */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Visibilidad de la sala
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPrivate(true)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border p-2.5 text-left transition-all text-xs",
                      isPrivate
                        ? "border-primary bg-primary/10 text-primary font-bold"
                        : "border-border/70 bg-card/50 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Shield className="h-4 w-4 shrink-0" />
                    <div>
                      <p className="font-semibold">Privada</p>
                      <p className="text-[10px] opacity-75">Solo con enlace/código</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPrivate(false)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border p-2.5 text-left transition-all text-xs",
                      !isPrivate
                        ? "border-primary bg-primary/10 text-primary font-bold"
                        : "border-border/70 bg-card/50 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Users className="h-4 w-4 shrink-0" />
                    <div>
                      <p className="font-semibold">Pública</p>
                      <p className="text-[10px] opacity-75">Visible en en vivo</p>
                    </div>
                  </button>
                </div>
              </div>

              {error ? (
                <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-2.5 text-xs text-destructive font-medium">
                  {error}
                </div>
              ) : null}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={creating || targetScore < 100 || targetScore > 400}
                  onClick={() => void handleCreate()}
                  className="rounded-full bg-primary px-6 py-2 text-xs font-bold text-primary-foreground shadow-md transition-transform hover:scale-105 disabled:opacity-50"
                >
                  {creating ? "Creando mesa…" : "Crear Sala y Obtener Enlace"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* PANTALLA DE SALA CREADA CON ENLACES PARA COMPARTIR A AMIGOS */
          <div>
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 text-lg">
                  ✓
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold">¡Sala Creada con Éxito!</h2>
                  <p className="text-xs text-muted-foreground">
                    Envía este enlace a tus amigos para que se unan a tu partida.
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Tarjeta con detalles de la sala */}
              <div className="rounded-2xl border border-gold/30 bg-card/80 p-4 text-center">
                <p className="text-xs font-medium text-muted-foreground">Código de Sala</p>
                <p className="font-mono text-3xl font-extrabold tracking-widest text-gold my-1">
                  {createdRoom.code}
                </p>
                <p className="text-xs text-foreground">
                  <strong>{createdRoom.name}</strong> · Meta:{" "}
                  <span className="text-gold font-bold">{createdRoom.targetScore} puntos</span>
                </p>
              </div>

              {/* Enlace de invitación directo con botón de copiar */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Enlace directo para unirse
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={inviteUrl}
                    className="min-w-0 flex-1 rounded-xl border border-input bg-card px-3 py-2 text-xs font-mono text-foreground focus:outline-none select-all"
                  />
                  <button
                    onClick={copyLink}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all",
                      copied
                        ? "bg-emerald-600 text-white"
                        : "bg-primary text-primary-foreground hover:scale-105",
                    )}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "¡Copiado!" : "Copiar"}
                  </button>
                </div>
              </div>

              {/* Botones directos de compartir por redes / mensajería */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-2">
                  Compartir rápidamente con amigos:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={shareWhatsApp}
                    className="flex flex-col items-center justify-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs font-semibold text-emerald-400 transition-transform hover:scale-105"
                  >
                    <MessageCircle className="h-5 w-5" />
                    WhatsApp
                  </button>
                  <button
                    onClick={shareTelegram}
                    className="flex flex-col items-center justify-center gap-1 rounded-xl border border-sky-500/30 bg-sky-500/10 p-2.5 text-xs font-semibold text-sky-400 transition-transform hover:scale-105"
                  >
                    <Send className="h-5 w-5" />
                    Telegram
                  </button>
                  <button
                    onClick={() => void shareNative()}
                    className="flex flex-col items-center justify-center gap-1 rounded-xl border border-gold/30 bg-gold/10 p-2.5 text-xs font-semibold text-gold transition-transform hover:scale-105"
                  >
                    <Share2 className="h-5 w-5" />
                    Compartir
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="w-full rounded-full bg-primary py-2.5 text-sm font-bold text-primary-foreground shadow-md transition-transform hover:scale-[1.02]"
                >
                  Entrar al Lobby de la Sala
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import { cn } from "@/lib/utils";
import { QUICK_GROUPS, EMOJI_PACKS, type ChatBubble } from "@/lib/domino/chat";
import { unlocksFor } from "@/lib/domino/levels";

/**
 * Chat rápido: frases predeterminadas + emojis desbloqueables.
 * Sin texto libre ni audio, para que nadie pueda cantarse las fichas.
 */
export function QuickChat({
  level,
  bubbles,
  onSend,
}: {
  level: number;
  bubbles: ChatBubble[];
  onSend: (text: string, emoji: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(QUICK_GROUPS[0]!.id);

  const emojiPacks = unlocksFor("emoji").filter((u) => level >= u.level);
  const emojis = emojiPacks.flatMap((p) => EMOJI_PACKS[p.id] ?? []);
  const group = QUICK_GROUPS.find((g) => g.id === tab) ?? QUICK_GROUPS[0]!;

  return (
    <div className="relative">
      <div className="mb-2 flex min-h-[1.75rem] flex-wrap items-center gap-1.5">
        {bubbles.slice(-4).map((b) => (
          <span
            key={b.id}
            className="animate-tile-drop rounded-full bg-card/90 px-3 py-1 text-xs font-medium text-foreground shadow"
          >
            <span className="mr-1">{b.emoji}</span>
            {b.text}
          </span>
        ))}
      </div>

      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "rounded-full border border-border bg-card px-4 py-1.5 text-sm font-semibold transition-colors",
          open && "border-gold text-gold",
        )}
      >
        💬 Chat rápido
      </button>

      {open ? (
        <div className="glass-panel absolute bottom-11 left-0 z-40 w-[min(22rem,88vw)] animate-scale-in rounded-2xl p-3">
          <div className="mb-2 flex flex-wrap gap-1">
            {QUICK_GROUPS.map((g) => (
              <button
                key={g.id}
                onClick={() => setTab(g.id)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors",
                  tab === g.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground",
                )}
              >
                {g.label}
              </button>
            ))}
          </div>

          <div className="grid gap-1">
            {group.phrases.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  onSend(p.text, p.emoji);
                  setOpen(false);
                }}
                className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-secondary"
              >
                <span>{p.emoji}</span>
                <span>{p.text}</span>
              </button>
            ))}
          </div>

          <div className="mt-2 border-t border-border pt-2">
            <p className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">
              Emojis · nivel {level}
            </p>
            <div className="flex flex-wrap gap-1">
              {emojis.map((e) => (
                <button
                  key={e}
                  onClick={() => {
                    onSend("", e);
                    setOpen(false);
                  }}
                  className="rounded-lg px-1.5 py-1 text-lg transition-transform hover:scale-125"
                >
                  {e}
                </button>
              ))}
            </div>
            {unlocksFor("emoji").some((u) => level < u.level) ? (
              <p className="mt-1.5 text-[10px] text-muted-foreground">
                Sube de nivel para desbloquear más emojis.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

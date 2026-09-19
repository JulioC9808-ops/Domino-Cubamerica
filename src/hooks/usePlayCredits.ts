import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

/**
 * Tiempo de juego restante del usuario (freemium: 30 min gratis).
 * La lógica de descuento por segundo jugado se conecta en la Fase 3.
 */
export function usePlayCredits() {
  const { user } = useAuth();
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setSecondsRemaining(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("play_credits")
      .select("seconds_remaining")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!data) {
      // primera vez: crea la fila con el default (1800 s = 30 min)
      const { data: created } = await supabase
        .from("play_credits")
        .insert({ user_id: user.id })
        .select("seconds_remaining")
        .single();
      setSecondsRemaining(created?.seconds_remaining ?? 0);
    } else {
      setSecondsRemaining(data.seconds_remaining);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    secondsRemaining,
    loading,
    hasTime: (secondsRemaining ?? 0) > 0,
    refresh,
  };
}

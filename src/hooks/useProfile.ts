import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { levelFromXp, detectCountry } from "@/lib/domino/levels";
import { FLAGS } from "@/lib/domino/themes";

export type Profile = {
  id: string;
  username: string;
  flag: string;
  avatar_url: string | null;
  player_code: string;
  level: number;
  xp: number;
  elo: number;
  title: string | null;
  frame: string;
  tile_skin: string;
  table_theme: string;
};

export function useProfile(userId?: string | null) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select(
        "id, username, flag, avatar_url, player_code, level, xp, elo, title, frame, tile_skin, table_theme",
      )
      .eq("id", userId)
      .maybeSingle();
    setProfile((data as Profile | null) ?? null);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Primera vez: auto-seleccionar la bandera del país detectado (solo si sigue el default)
  useEffect(() => {
    if (!userId || !profile) return;
    if (profile.flag !== "cu") return; // ya eligió bandera
    const country = detectCountry();
    if (!country || country === "cu") return;
    if (!FLAGS.some((f) => f.code === country)) return;
    const key = `flag-auto-${userId}`;
    if (localStorage.getItem(key)) return; // solo una vez por usuario/dispositivo
    localStorage.setItem(key, "1");
    void supabase.from("profiles").update({ flag: country }).eq("id", userId);
    setProfile((p) => (p ? { ...p, flag: country } : p));
  }, [userId, profile]);

  const update = useCallback(
    async (patch: Partial<Profile>) => {
      if (!userId) return { error: new Error("No autenticado") };
      const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
      if (!error) setProfile((p) => (p ? { ...p, ...patch } : p));
      return { error };
    },
    [userId],
  );

  const progress = levelFromXp(profile?.xp ?? 0);
  return { profile, loading, reload: load, update, progress };
}

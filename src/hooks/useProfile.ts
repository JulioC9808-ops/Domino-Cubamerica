import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { levelFromXp } from "@/lib/domino/levels";

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

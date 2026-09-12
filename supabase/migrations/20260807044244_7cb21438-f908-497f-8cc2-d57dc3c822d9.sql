ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS player_code text,
  ADD COLUMN IF NOT EXISTS level integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS xp integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS elo integer NOT NULL DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS frame text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS tile_skin text NOT NULL DEFAULT 'hueso',
  ADD COLUMN IF NOT EXISTS table_theme text NOT NULL DEFAULT 'habana';

UPDATE public.profiles SET player_code = upper(substr(md5(id::text), 1, 8)) WHERE player_code IS NULL;
ALTER TABLE public.profiles ALTER COLUMN player_code SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_player_code_key ON public.profiles(player_code);

ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'pairs',
  ADD COLUMN IF NOT EXISTS max_pip integer NOT NULL DEFAULT 6;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, username, flag, avatar_url, player_code)
  VALUES (
    NEW.id,
    coalesce(NEW.raw_user_meta_data ->> 'username', NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1), 'Jugador'),
    coalesce(NEW.raw_user_meta_data ->> 'flag', 'cu'),
    NEW.raw_user_meta_data ->> 'avatar_url',
    upper(substr(md5(NEW.id::text), 1, 8))
  ) ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_stats (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  INSERT INTO public.play_credits (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$function$;

CREATE TABLE IF NOT EXISTS public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (requester_id, addressee_id),
  CHECK (requester_id <> addressee_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.friendships TO authenticated;
GRANT ALL ON public.friendships TO service_role;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY friendships_select_mine ON public.friendships FOR SELECT TO authenticated
  USING (requester_id = auth.uid() OR addressee_id = auth.uid());
CREATE POLICY friendships_insert_self ON public.friendships FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid());
CREATE POLICY friendships_update_involved ON public.friendships FOR UPDATE TO authenticated
  USING (requester_id = auth.uid() OR addressee_id = auth.uid())
  WITH CHECK (requester_id = auth.uid() OR addressee_id = auth.uid());
CREATE POLICY friendships_delete_involved ON public.friendships FOR DELETE TO authenticated
  USING (requester_id = auth.uid() OR addressee_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.game_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  from_user uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_invites TO authenticated;
GRANT ALL ON public.game_invites TO service_role;
ALTER TABLE public.game_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY invites_select_involved ON public.game_invites FOR SELECT TO authenticated
  USING (from_user = auth.uid() OR to_user = auth.uid());
CREATE POLICY invites_insert_self ON public.game_invites FOR INSERT TO authenticated
  WITH CHECK (from_user = auth.uid());
CREATE POLICY invites_update_involved ON public.game_invites FOR UPDATE TO authenticated
  USING (from_user = auth.uid() OR to_user = auth.uid())
  WITH CHECK (from_user = auth.uid() OR to_user = auth.uid());
CREATE POLICY invites_delete_involved ON public.game_invites FOR DELETE TO authenticated
  USING (from_user = auth.uid() OR to_user = auth.uid());

CREATE TABLE IF NOT EXISTS public.match_queue (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  mode text NOT NULL DEFAULT 'pairs',
  max_pip integer NOT NULL DEFAULT 6,
  elo integer NOT NULL DEFAULT 1000,
  level integer NOT NULL DEFAULT 1,
  room_id uuid REFERENCES public.rooms(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_queue TO authenticated;
GRANT ALL ON public.match_queue TO service_role;
ALTER TABLE public.match_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY queue_select_all ON public.match_queue FOR SELECT TO authenticated USING (true);
CREATE POLICY queue_write_own ON public.match_queue FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY queue_update_own ON public.match_queue FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY queue_delete_own ON public.match_queue FOR DELETE TO authenticated USING (user_id = auth.uid());
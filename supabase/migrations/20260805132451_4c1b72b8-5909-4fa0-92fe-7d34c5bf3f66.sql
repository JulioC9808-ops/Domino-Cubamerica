CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  flag text NOT NULL DEFAULT 'cu',
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- STATS
CREATE TABLE public.user_stats (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  games_played int NOT NULL DEFAULT 0,
  games_won int NOT NULL DEFAULT 0,
  points_for int NOT NULL DEFAULT 0,
  points_against int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.user_stats TO authenticated;
GRANT ALL ON public.user_stats TO service_role;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stats_select_all" ON public.user_stats FOR SELECT TO authenticated USING (true);
CREATE POLICY "stats_update_own" ON public.user_stats FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "stats_insert_own" ON public.user_stats FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- PLAY CREDITS (60 free minutes)
CREATE TABLE public.play_credits (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  seconds_remaining int NOT NULL DEFAULT 3600,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.play_credits TO authenticated;
GRANT ALL ON public.play_credits TO service_role;
ALTER TABLE public.play_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "credits_own" ON public.play_credits FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- SUBSCRIPTIONS
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX subscriptions_user_idx ON public.subscriptions(user_id, expires_at DESC);
GRANT SELECT, INSERT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subs_select_own" ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ROOMS
CREATE TABLE public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  host_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_private boolean NOT NULL DEFAULT false,
  password_hash text,
  theme text NOT NULL DEFAULT 'habana',
  flag text NOT NULL DEFAULT 'cu',
  status text NOT NULL DEFAULT 'waiting',
  target_score int NOT NULL DEFAULT 100,
  max_players int NOT NULL DEFAULT 4,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rooms TO authenticated;
GRANT ALL ON public.rooms TO service_role;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- ROOM PLAYERS
CREATE TABLE public.room_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seat int NOT NULL,
  connected boolean NOT NULL DEFAULT true,
  last_seen timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, user_id),
  UNIQUE (room_id, seat)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.room_players TO authenticated;
GRANT ALL ON public.room_players TO service_role;
ALTER TABLE public.room_players ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_room_member(_room_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.room_players WHERE room_id = _room_id AND user_id = _user_id);
$$;

CREATE POLICY "rooms_select_member_or_host" ON public.rooms FOR SELECT TO authenticated
  USING (host_id = auth.uid() OR public.is_room_member(id, auth.uid()));
CREATE POLICY "rooms_insert_host" ON public.rooms FOR INSERT TO authenticated WITH CHECK (host_id = auth.uid());
CREATE POLICY "rooms_update_host" ON public.rooms FOR UPDATE TO authenticated USING (host_id = auth.uid()) WITH CHECK (host_id = auth.uid());
CREATE POLICY "rooms_delete_host" ON public.rooms FOR DELETE TO authenticated USING (host_id = auth.uid());

CREATE POLICY "room_players_select_member" ON public.room_players FOR SELECT TO authenticated
  USING (public.is_room_member(room_id, auth.uid()));
CREATE POLICY "room_players_insert_self" ON public.room_players FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "room_players_update_self" ON public.room_players FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "room_players_delete_self_or_host" ON public.room_players FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.rooms r WHERE r.id = room_id AND r.host_id = auth.uid()));

-- CHAT
CREATE TABLE public.room_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX room_messages_room_idx ON public.room_messages(room_id, created_at);
GRANT SELECT, INSERT ON public.room_messages TO authenticated;
GRANT ALL ON public.room_messages TO service_role;
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_select_member" ON public.room_messages FOR SELECT TO authenticated
  USING (public.is_room_member(room_id, auth.uid()));
CREATE POLICY "messages_insert_member" ON public.room_messages FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_room_member(room_id, auth.uid()));

-- GAMES
CREATE TABLE public.games (
  room_id uuid PRIMARY KEY REFERENCES public.rooms(id) ON DELETE CASCADE,
  state jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.games TO authenticated;
GRANT ALL ON public.games TO service_role;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "games_select_member" ON public.games FOR SELECT TO authenticated
  USING (public.is_room_member(room_id, auth.uid()));
CREATE POLICY "games_write_member" ON public.games FOR ALL TO authenticated
  USING (public.is_room_member(room_id, auth.uid()))
  WITH CHECK (public.is_room_member(room_id, auth.uid()));

-- PUBLIC LOBBY VIEW (no password exposed)
CREATE VIEW public.lobby_rooms
WITH (security_invoker = off) AS
  SELECT r.id, r.code, r.name, r.host_id, r.is_private, r.theme, r.flag, r.status,
         r.target_score, r.max_players, r.created_at,
         (SELECT count(*) FROM public.room_players p WHERE p.room_id = r.id) AS player_count
  FROM public.rooms r
  WHERE r.status <> 'closed';
GRANT SELECT ON public.lobby_rooms TO authenticated;

-- JOIN ROOM (verifies password)
CREATE OR REPLACE FUNCTION public.join_room(_code text, _password text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r public.rooms%ROWTYPE;
  uid uuid := auth.uid();
  free_seat int;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;
  SELECT * INTO r FROM public.rooms WHERE upper(code) = upper(_code);
  IF NOT FOUND THEN RAISE EXCEPTION 'Sala no encontrada'; END IF;
  IF r.is_private AND r.password_hash IS NOT NULL THEN
    IF _password IS NULL OR r.password_hash <> crypt(_password, r.password_hash) THEN
      RAISE EXCEPTION 'Contraseña incorrecta';
    END IF;
  END IF;
  IF EXISTS (SELECT 1 FROM public.room_players WHERE room_id = r.id AND user_id = uid) THEN
    UPDATE public.room_players SET connected = true, last_seen = now() WHERE room_id = r.id AND user_id = uid;
    RETURN r.id;
  END IF;
  SELECT s INTO free_seat FROM generate_series(0, r.max_players - 1) s
    WHERE s NOT IN (SELECT seat FROM public.room_players WHERE room_id = r.id) ORDER BY s LIMIT 1;
  IF free_seat IS NULL THEN RAISE EXCEPTION 'La sala está llena'; END IF;
  INSERT INTO public.room_players (room_id, user_id, seat) VALUES (r.id, uid, free_seat);
  RETURN r.id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.join_room(text, text) TO authenticated;

-- CREATE ROOM (hashes password)
CREATE OR REPLACE FUNCTION public.create_room(_name text, _is_private boolean, _password text, _theme text, _flag text, _target_score int)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  new_code text;
  new_id uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;
  LOOP
    new_code := upper(substr(md5(random()::text), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.rooms WHERE code = new_code);
  END LOOP;
  INSERT INTO public.rooms (code, name, host_id, is_private, password_hash, theme, flag, target_score)
  VALUES (new_code, left(coalesce(nullif(trim(_name), ''), 'Mesa de dominó'), 40), uid, coalesce(_is_private, false),
          CASE WHEN _password IS NULL OR _password = '' THEN NULL ELSE crypt(_password, gen_salt('bf')) END,
          coalesce(_theme, 'habana'), coalesce(_flag, 'cu'), coalesce(_target_score, 100))
  RETURNING id INTO new_id;
  INSERT INTO public.room_players (room_id, user_id, seat) VALUES (new_id, uid, 0);
  RETURN new_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_room(text, boolean, text, text, text, int) TO authenticated;

-- NEW USER BOOTSTRAP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, username, flag, avatar_url)
  VALUES (
    NEW.id,
    coalesce(NEW.raw_user_meta_data ->> 'username', NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1), 'Jugador'),
    coalesce(NEW.raw_user_meta_data ->> 'flag', 'cu'),
    NEW.raw_user_meta_data ->> 'avatar_url'
  ) ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_stats (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  INSERT INTO public.play_credits (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- REALTIME
ALTER TABLE public.rooms REPLICA IDENTITY FULL;
ALTER TABLE public.room_players REPLICA IDENTITY FULL;
ALTER TABLE public.room_messages REPLICA IDENTITY FULL;
ALTER TABLE public.games REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.games;
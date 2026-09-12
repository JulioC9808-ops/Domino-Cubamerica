DROP VIEW public.lobby_rooms;

CREATE POLICY "rooms_select_public" ON public.rooms FOR SELECT TO authenticated
  USING (is_private = false AND status <> 'closed');

CREATE VIEW public.lobby_rooms
WITH (security_invoker = on) AS
  SELECT r.id, r.code, r.name, r.host_id, r.is_private, r.theme, r.flag, r.status,
         r.target_score, r.max_players, r.created_at,
         (SELECT count(*) FROM public.room_players p WHERE p.room_id = r.id) AS player_count
  FROM public.rooms r
  WHERE r.status <> 'closed';
GRANT SELECT ON public.lobby_rooms TO authenticated;

REVOKE EXECUTE ON FUNCTION public.join_room(text, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.create_room(text, boolean, text, text, text, int) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_room_member(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, public, authenticated;
GRANT EXECUTE ON FUNCTION public.join_room(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_room(text, boolean, text, text, text, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_room_member(uuid, uuid) TO authenticated;
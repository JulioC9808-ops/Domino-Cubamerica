export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      friendships: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      game_invites: {
        Row: {
          created_at: string
          from_user: string
          id: string
          room_id: string
          status: string
          to_user: string
        }
        Insert: {
          created_at?: string
          from_user: string
          id?: string
          room_id: string
          status?: string
          to_user: string
        }
        Update: {
          created_at?: string
          from_user?: string
          id?: string
          room_id?: string
          status?: string
          to_user?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_invites_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "lobby_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_invites_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          room_id: string
          state: Json
          updated_at: string
        }
        Insert: {
          room_id: string
          state: Json
          updated_at?: string
        }
        Update: {
          room_id?: string
          state?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "games_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: true
            referencedRelation: "lobby_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: true
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      match_queue: {
        Row: {
          created_at: string
          elo: number
          level: number
          max_pip: number
          mode: string
          room_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          elo?: number
          level?: number
          max_pip?: number
          mode?: string
          room_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          elo?: number
          level?: number
          max_pip?: number
          mode?: string
          room_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_queue_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "lobby_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_queue_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      play_credits: {
        Row: {
          seconds_remaining: number
          updated_at: string
          user_id: string
        }
        Insert: {
          seconds_remaining?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          seconds_remaining?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          elo: number
          flag: string
          frame: string
          id: string
          level: number
          player_code: string
          table_theme: string
          tile_skin: string
          title: string | null
          username: string
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          elo?: number
          flag?: string
          frame?: string
          id: string
          level?: number
          player_code: string
          table_theme?: string
          tile_skin?: string
          title?: string | null
          username: string
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          elo?: number
          flag?: string
          frame?: string
          id?: string
          level?: number
          player_code?: string
          table_theme?: string
          tile_skin?: string
          title?: string | null
          username?: string
          xp?: number
        }
        Relationships: []
      }
      room_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          room_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          room_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "lobby_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_players: {
        Row: {
          connected: boolean
          id: string
          last_seen: string
          room_id: string
          seat: number
          user_id: string
        }
        Insert: {
          connected?: boolean
          id?: string
          last_seen?: string
          room_id: string
          seat: number
          user_id: string
        }
        Update: {
          connected?: boolean
          id?: string
          last_seen?: string
          room_id?: string
          seat?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_players_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "lobby_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_players_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          code: string
          created_at: string
          flag: string
          host_id: string
          id: string
          is_private: boolean
          max_pip: number
          max_players: number
          mode: string
          name: string
          password_hash: string | null
          status: string
          target_score: number
          theme: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          flag?: string
          host_id: string
          id?: string
          is_private?: boolean
          max_pip?: number
          max_players?: number
          mode?: string
          name: string
          password_hash?: string | null
          status?: string
          target_score?: number
          theme?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          flag?: string
          host_id?: string
          id?: string
          is_private?: boolean
          max_pip?: number
          max_players?: number
          mode?: string
          name?: string
          password_hash?: string | null
          status?: string
          target_score?: number
          theme?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          plan: string
          started_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          plan: string
          started_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          plan?: string
          started_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          games_played: number
          games_won: number
          points_against: number
          points_for: number
          updated_at: string
          user_id: string
        }
        Insert: {
          games_played?: number
          games_won?: number
          points_against?: number
          points_for?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          games_played?: number
          games_won?: number
          points_against?: number
          points_for?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      lobby_rooms: {
        Row: {
          code: string | null
          created_at: string | null
          flag: string | null
          host_id: string | null
          id: string | null
          is_private: boolean | null
          max_players: number | null
          name: string | null
          player_count: number | null
          status: string | null
          target_score: number | null
          theme: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          flag?: string | null
          host_id?: string | null
          id?: string | null
          is_private?: boolean | null
          max_players?: number | null
          name?: string | null
          player_count?: never
          status?: string | null
          target_score?: number | null
          theme?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          flag?: string | null
          host_id?: string | null
          id?: string | null
          is_private?: boolean | null
          max_players?: number | null
          name?: string | null
          player_count?: never
          status?: string | null
          target_score?: number | null
          theme?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_room: {
        Args: {
          _flag: string
          _is_private: boolean
          _name: string
          _password: string
          _target_score: number
          _theme: string
        }
        Returns: string
      }
      is_room_member: {
        Args: { _room_id: string; _user_id: string }
        Returns: boolean
      }
      join_room: {
        Args: { _code: string; _password?: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

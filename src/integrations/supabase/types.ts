export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          team_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          team_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          team_id?: string | null
        }
        Relationships: []
      }
      exercises: {
        Row: {
          age_group: string | null
          category: Database["public"]["Enums"]["team_category"] | null
          created_at: string
          duration_min: number | null
          game_phase: Database["public"]["Enums"]["game_phase"] | null
          id: string
          image_url: string | null
          intensity: Database["public"]["Enums"]["exercise_intensity"] | null
          is_favorite: boolean
          level: string | null
          materials: string | null
          name: string
          objective: string | null
          observations: string | null
          owner_id: string
          players_count: number | null
          space: string | null
          tags: string[]
          task_type: Database["public"]["Enums"]["task_type"] | null
          team_id: string | null
          updated_at: string
          variants: string | null
        }
        Insert: {
          age_group?: string | null
          category?: Database["public"]["Enums"]["team_category"] | null
          created_at?: string
          duration_min?: number | null
          game_phase?: Database["public"]["Enums"]["game_phase"] | null
          id?: string
          image_url?: string | null
          intensity?: Database["public"]["Enums"]["exercise_intensity"] | null
          is_favorite?: boolean
          level?: string | null
          materials?: string | null
          name: string
          objective?: string | null
          observations?: string | null
          owner_id: string
          players_count?: number | null
          space?: string | null
          tags?: string[]
          task_type?: Database["public"]["Enums"]["task_type"] | null
          team_id?: string | null
          updated_at?: string
          variants?: string | null
        }
        Update: {
          age_group?: string | null
          category?: Database["public"]["Enums"]["team_category"] | null
          created_at?: string
          duration_min?: number | null
          game_phase?: Database["public"]["Enums"]["game_phase"] | null
          id?: string
          image_url?: string | null
          intensity?: Database["public"]["Enums"]["exercise_intensity"] | null
          is_favorite?: boolean
          level?: string | null
          materials?: string | null
          name?: string
          objective?: string | null
          observations?: string | null
          owner_id?: string
          players_count?: number | null
          space?: string | null
          tags?: string[]
          task_type?: Database["public"]["Enums"]["task_type"] | null
          team_id?: string | null
          updated_at?: string
          variants?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercises_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      mesocycles: {
        Row: {
          created_at: string
          end_date: string
          goals: string | null
          id: string
          name: string
          notes: string | null
          owner_id: string
          phases: Json
          start_date: string
          team_id: string | null
          type: Database["public"]["Enums"]["mesocycle_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          goals?: string | null
          id?: string
          name: string
          notes?: string | null
          owner_id: string
          phases?: Json
          start_date: string
          team_id?: string | null
          type?: Database["public"]["Enums"]["mesocycle_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          goals?: string | null
          id?: string
          name?: string
          notes?: string | null
          owner_id?: string
          phases?: Json
          start_date?: string
          team_id?: string | null
          type?: Database["public"]["Enums"]["mesocycle_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mesocycles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      microcycle_slots: {
        Row: {
          id: string
          microcycle_id: string
          notes: string | null
          session_id: string | null
          slot_date: string | null
          slot_type: string
        }
        Insert: {
          id?: string
          microcycle_id: string
          notes?: string | null
          session_id?: string | null
          slot_date?: string | null
          slot_type: string
        }
        Update: {
          id?: string
          microcycle_id?: string
          notes?: string | null
          session_id?: string | null
          slot_date?: string | null
          slot_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "microcycle_slots_microcycle_id_fkey"
            columns: ["microcycle_id"]
            isOneToOne: false
            referencedRelation: "microcycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "microcycle_slots_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      microcycles: {
        Row: {
          created_at: string
          id: string
          match_day: string
          mesocycle_id: string | null
          name: string
          notes: string | null
          owner_id: string
          team_id: string | null
          updated_at: string
          week_start: string
          weekly_objective: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          match_day?: string
          mesocycle_id?: string | null
          name: string
          notes?: string | null
          owner_id: string
          team_id?: string | null
          updated_at?: string
          week_start: string
          weekly_objective?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          match_day?: string
          mesocycle_id?: string | null
          name?: string
          notes?: string | null
          owner_id?: string
          team_id?: string | null
          updated_at?: string
          week_start?: string
          weekly_objective?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "microcycles_mesocycle_id_fkey"
            columns: ["mesocycle_id"]
            isOneToOne: false
            referencedRelation: "mesocycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "microcycles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          created_at: string
          id: string
          name: string
          number: number | null
          owner_id: string
          photo_url: string | null
          position: string | null
          team_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          number?: number | null
          owner_id: string
          photo_url?: string | null
          position?: string | null
          team_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          number?: number | null
          owner_id?: string
          photo_url?: string | null
          position?: string | null
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      season_events: {
        Row: {
          created_at: string
          event_date: string
          id: string
          is_home: boolean | null
          location: string | null
          notes: string | null
          opponent: string | null
          owner_id: string
          result: string | null
          team_id: string | null
          title: string
          type: Database["public"]["Enums"]["season_event_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_date: string
          id?: string
          is_home?: boolean | null
          location?: string | null
          notes?: string | null
          opponent?: string | null
          owner_id: string
          result?: string | null
          team_id?: string | null
          title: string
          type?: Database["public"]["Enums"]["season_event_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_date?: string
          id?: string
          is_home?: boolean | null
          location?: string | null
          notes?: string | null
          opponent?: string | null
          owner_id?: string
          result?: string | null
          team_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["season_event_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "season_events_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      session_block_exercises: {
        Row: {
          block_id: string
          created_at: string
          duration_override: number | null
          exercise_id: string
          id: string
          notes: string | null
          position: number
        }
        Insert: {
          block_id: string
          created_at?: string
          duration_override?: number | null
          exercise_id: string
          id?: string
          notes?: string | null
          position?: number
        }
        Update: {
          block_id?: string
          created_at?: string
          duration_override?: number | null
          exercise_id?: string
          id?: string
          notes?: string | null
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "session_block_exercises_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "session_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_block_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      session_blocks: {
        Row: {
          block_type: Database["public"]["Enums"]["block_type"]
          created_at: string
          duration_min: number | null
          id: string
          name: string | null
          notes: string | null
          position: number
          session_id: string
        }
        Insert: {
          block_type: Database["public"]["Enums"]["block_type"]
          created_at?: string
          duration_min?: number | null
          id?: string
          name?: string | null
          notes?: string | null
          position?: number
          session_id: string
        }
        Update: {
          block_type?: Database["public"]["Enums"]["block_type"]
          created_at?: string
          duration_min?: number | null
          id?: string
          name?: string | null
          notes?: string | null
          position?: number
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_blocks_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_evaluations: {
        Row: {
          created_at: string
          evaluated_at: string
          id: string
          intensity_perceived:
            | Database["public"]["Enums"]["perceived_intensity"]
            | null
          objectives_met: boolean | null
          owner_id: string
          player_notes: string | null
          rating: number | null
          session_id: string
          updated_at: string
          what_to_improve: string | null
          what_worked: string | null
        }
        Insert: {
          created_at?: string
          evaluated_at?: string
          id?: string
          intensity_perceived?:
            | Database["public"]["Enums"]["perceived_intensity"]
            | null
          objectives_met?: boolean | null
          owner_id: string
          player_notes?: string | null
          rating?: number | null
          session_id: string
          updated_at?: string
          what_to_improve?: string | null
          what_worked?: string | null
        }
        Update: {
          created_at?: string
          evaluated_at?: string
          id?: string
          intensity_perceived?:
            | Database["public"]["Enums"]["perceived_intensity"]
            | null
          objectives_met?: boolean | null
          owner_id?: string
          player_notes?: string | null
          rating?: number | null
          session_id?: string
          updated_at?: string
          what_to_improve?: string | null
          what_worked?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_evaluations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string
          duration_min: number | null
          evaluation: string | null
          id: string
          intensity: Database["public"]["Enums"]["exercise_intensity"] | null
          is_template: boolean
          name: string
          notes: string | null
          objective: string | null
          owner_id: string
          session_date: string | null
          team_id: string | null
          updated_at: string
          weekly_focus: string | null
        }
        Insert: {
          created_at?: string
          duration_min?: number | null
          evaluation?: string | null
          id?: string
          intensity?: Database["public"]["Enums"]["exercise_intensity"] | null
          is_template?: boolean
          name: string
          notes?: string | null
          objective?: string | null
          owner_id: string
          session_date?: string | null
          team_id?: string | null
          updated_at?: string
          weekly_focus?: string | null
        }
        Update: {
          created_at?: string
          duration_min?: number | null
          evaluation?: string | null
          id?: string
          intensity?: Database["public"]["Enums"]["exercise_intensity"] | null
          is_template?: boolean
          name?: string
          notes?: string | null
          objective?: string | null
          owner_id?: string
          session_date?: string | null
          team_id?: string | null
          updated_at?: string
          weekly_focus?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["team_member_role"]
          team_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["team_member_role"]
          team_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["team_member_role"]
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["team_member_role"]
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["team_member_role"]
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["team_member_role"]
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          age_group: string | null
          category: Database["public"]["Enums"]["team_category"]
          created_at: string
          id: string
          logo_url: string | null
          match_day: string
          name: string
          notes: string | null
          owner_id: string
          season: string | null
          shield_url: string | null
          updated_at: string
        }
        Insert: {
          age_group?: string | null
          category?: Database["public"]["Enums"]["team_category"]
          created_at?: string
          id?: string
          logo_url?: string | null
          match_day?: string
          name: string
          notes?: string | null
          owner_id: string
          season?: string | null
          shield_url?: string | null
          updated_at?: string
        }
        Update: {
          age_group?: string | null
          category?: Database["public"]["Enums"]["team_category"]
          created_at?: string
          id?: string
          logo_url?: string | null
          match_day?: string
          name?: string
          notes?: string | null
          owner_id?: string
          season?: string | null
          shield_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_team_invitation: {
        Args: { p_invitation_id: string }
        Returns: string
      }
      add_team_member: {
        Args: {
          p_role: Database["public"]["Enums"]["team_member_role"]
          p_team_id: string
          p_user_id: string
        }
        Returns: string
      }
      assign_microcycle_session: {
        Args: { p_session_id: string; p_slot_id: string }
        Returns: undefined
      }
      can_edit_team: {
        Args: { p_team_id: string; p_user_id?: string }
        Returns: boolean
      }
      create_microcycle_with_slots: {
        Args: {
          p_match_day: string
          p_name: string
          p_week_start: string
          p_weekly_objective?: string
        }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      invite_team_member_by_email: {
        Args: {
          p_email: string
          p_role: Database["public"]["Enums"]["team_member_role"]
          p_team_id: string
        }
        Returns: string
      }
      is_team_member: {
        Args: { p_team_id: string; p_user_id?: string }
        Returns: boolean
      }
      save_session_graph: {
        Args: {
          p_blocks: Json
          p_duration_min: number
          p_intensity: Database["public"]["Enums"]["exercise_intensity"]
          p_name: string
          p_objective: string
          p_session_date: string
          p_session_id: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "coach" | "physical_coach" | "analyst"
      block_type:
        | "calentamiento"
        | "parte_principal"
        | "juego_aplicacion"
        | "vuelta_calma"
      exercise_intensity: "baja" | "media" | "alta" | "muy_alta"
      game_phase:
        | "inicio"
        | "progresion"
        | "finalizacion"
        | "transicion_ad"
        | "transicion_da"
        | "abp"
        | "general"
      mesocycle_type: "pretemporada" | "temporada"
      perceived_intensity: "baja" | "media" | "alta" | "muy_alta"
      season_event_type:
        | "partido_oficial"
        | "amistoso"
        | "test_fisico"
        | "descanso"
        | "evento"
        | "reunion"
      task_type:
        | "analitica"
        | "global"
        | "integrada"
        | "situacional"
        | "competitiva"
        | "rondo"
        | "juego_reducido"
        | "partido"
      team_category:
        | "futbol_base"
        | "amateur"
        | "cantera"
        | "alto_rendimiento"
        | "elite"
      team_member_role: "coach" | "physical_coach" | "analyst" | "viewer"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["admin", "coach", "physical_coach", "analyst"],
      block_type: [
        "calentamiento",
        "parte_principal",
        "juego_aplicacion",
        "vuelta_calma",
      ],
      exercise_intensity: ["baja", "media", "alta", "muy_alta"],
      game_phase: [
        "inicio",
        "progresion",
        "finalizacion",
        "transicion_ad",
        "transicion_da",
        "abp",
        "general",
      ],
      mesocycle_type: ["pretemporada", "temporada"],
      perceived_intensity: ["baja", "media", "alta", "muy_alta"],
      season_event_type: [
        "partido_oficial",
        "amistoso",
        "test_fisico",
        "descanso",
        "evento",
        "reunion",
      ],
      task_type: [
        "analitica",
        "global",
        "integrada",
        "situacional",
        "competitiva",
        "rondo",
        "juego_reducido",
        "partido",
      ],
      team_category: [
        "futbol_base",
        "amateur",
        "cantera",
        "alto_rendimiento",
        "elite",
      ],
      team_member_role: ["coach", "physical_coach", "analyst", "viewer"],
    },
  },
} as const

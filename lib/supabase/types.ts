export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      achievements: {
        Row: {
          code: string;
          unlocked_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          code: string;
          unlocked_at?: string;
          user_id: string;
        };
        Update: {
          code?: string;
          unlocked_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "achievements_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      content_items: {
        Row: {
          est_minutes: number;
          grammar_tags: string[];
          id: string;
          is_active: boolean;
          level: string;
          payload: NonNullable<Json>;
          slug: string;
          topics: string[];
          type: string;
          updated_at: string;
          version: number;
        };
        ComputedFields: never;
        Insert: {
          est_minutes: number;
          grammar_tags?: string[];
          id?: string;
          is_active?: boolean;
          level: string;
          payload: NonNullable<Json>;
          slug: string;
          topics?: string[];
          type: string;
          updated_at?: string;
          version?: number;
        };
        Update: {
          est_minutes?: number;
          grammar_tags?: string[];
          id?: string;
          is_active?: boolean;
          level?: string;
          payload?: NonNullable<Json>;
          slug?: string;
          topics?: string[];
          type?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [];
      };
      daily_activity: {
        Row: {
          active_seconds: number;
          goal_minutes: number;
          local_date: string;
          status: string;
          user_id: string;
          xp: number;
        };
        ComputedFields: never;
        Insert: {
          active_seconds?: number;
          goal_minutes: number;
          local_date: string;
          status?: string;
          user_id: string;
          xp?: number;
        };
        Update: {
          active_seconds?: number;
          goal_minutes?: number;
          local_date?: string;
          status?: string;
          user_id?: string;
          xp?: number;
        };
        Relationships: [
          {
            foreignKeyName: "daily_activity_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      exercise_attempts: {
        Row: {
          activity_type: string;
          completed_at: string | null;
          content_id: string | null;
          id: string;
          prompt_version: string | null;
          score: number | null;
          session_id: string;
          started_at: string;
          status: string;
          user_id: string;
          valid_seconds: number;
          xp: number;
          _attempt_effort_met: boolean | null;
        };
        ComputedFields: "_attempt_effort_met";
        Insert: {
          activity_type: string;
          completed_at?: string | null;
          content_id?: string | null;
          id?: string;
          prompt_version?: string | null;
          score?: number | null;
          session_id: string;
          started_at?: string;
          status?: string;
          user_id: string;
          valid_seconds?: number;
          xp?: number;
        };
        Update: {
          activity_type?: string;
          completed_at?: string | null;
          content_id?: string | null;
          id?: string;
          prompt_version?: string | null;
          score?: number | null;
          session_id?: string;
          started_at?: string;
          status?: string;
          user_id?: string;
          valid_seconds?: number;
          xp?: number;
        };
        Relationships: [
          {
            foreignKeyName: "exercise_attempts_content_id_fkey";
            columns: ["content_id"];
            isOneToOne: false;
            referencedRelation: "content_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exercise_attempts_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "practice_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exercise_attempts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      practice_sessions: {
        Row: {
          ended_at: string | null;
          id: string;
          mode: string;
          plan: NonNullable<Json>;
          started_at: string;
          status: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          ended_at?: string | null;
          id?: string;
          mode: string;
          plan?: NonNullable<Json>;
          started_at?: string;
          status?: string;
          user_id: string;
        };
        Update: {
          ended_at?: string | null;
          id?: string;
          mode?: string;
          plan?: NonNullable<Json>;
          started_at?: string;
          status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "practice_sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          accent: string;
          correction_mode: string;
          created_at: string;
          daily_goal_minutes: number;
          display_name: string | null;
          id: string;
          interests: string[];
          new_cards_per_day: number;
          pending_daily_goal: number | null;
          pending_goal_from: string | null;
          playback_rate: number;
          reminder_time: string | null;
          sublevels: NonNullable<Json>;
          timezone: string;
          timezone_changed_at: string | null;
          updated_at: string;
          weekly_goal_days: number;
        };
        ComputedFields: never;
        Insert: {
          accent?: string;
          correction_mode?: string;
          created_at?: string;
          daily_goal_minutes?: number;
          display_name?: string | null;
          id: string;
          interests?: string[];
          new_cards_per_day?: number;
          pending_daily_goal?: number | null;
          pending_goal_from?: string | null;
          playback_rate?: number;
          reminder_time?: string | null;
          sublevels?: NonNullable<Json>;
          timezone?: string;
          timezone_changed_at?: string | null;
          updated_at?: string;
          weekly_goal_days?: number;
        };
        Update: {
          accent?: string;
          correction_mode?: string;
          created_at?: string;
          daily_goal_minutes?: number;
          display_name?: string | null;
          id?: string;
          interests?: string[];
          new_cards_per_day?: number;
          pending_daily_goal?: number | null;
          pending_goal_from?: string | null;
          playback_rate?: number;
          reminder_time?: string | null;
          sublevels?: NonNullable<Json>;
          timezone?: string;
          timezone_changed_at?: string | null;
          updated_at?: string;
          weekly_goal_days?: number;
        };
        Relationships: [];
      };
      review_logs: {
        Row: {
          answer: string | null;
          card_id: string;
          elapsed_days: number;
          id: string;
          rating: number;
          reviewed_at: string;
          scheduled_days: number;
          state: number;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          answer?: string | null;
          card_id: string;
          elapsed_days?: number;
          id?: string;
          rating: number;
          reviewed_at?: string;
          scheduled_days?: number;
          state: number;
          user_id: string;
        };
        Update: {
          answer?: string | null;
          card_id?: string;
          elapsed_days?: number;
          id?: string;
          rating?: number;
          reviewed_at?: string;
          scheduled_days?: number;
          state?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "review_logs_card_id_user_id_fkey";
            columns: ["card_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "srs_cards";
            referencedColumns: ["id", "user_id"];
          },
          {
            foreignKeyName: "review_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      srs_cards: {
        Row: {
          card_type: string;
          content_id: string | null;
          difficulty: number;
          due: string;
          elapsed_days: number;
          error_id: string | null;
          id: string;
          lapses: number;
          last_review: string | null;
          learning_steps: number;
          reps: number;
          scheduled_days: number;
          stability: number;
          state: number;
          suspended: boolean;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          card_type: string;
          content_id?: string | null;
          difficulty?: number;
          due?: string;
          elapsed_days?: number;
          error_id?: string | null;
          id?: string;
          lapses?: number;
          last_review?: string | null;
          learning_steps?: number;
          reps?: number;
          scheduled_days?: number;
          stability?: number;
          state?: number;
          suspended?: boolean;
          user_id: string;
        };
        Update: {
          card_type?: string;
          content_id?: string | null;
          difficulty?: number;
          due?: string;
          elapsed_days?: number;
          error_id?: string | null;
          id?: string;
          lapses?: number;
          last_review?: string | null;
          learning_steps?: number;
          reps?: number;
          scheduled_days?: number;
          stability?: number;
          state?: number;
          suspended?: boolean;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "srs_cards_content_id_fkey";
            columns: ["content_id"];
            isOneToOne: false;
            referencedRelation: "content_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "srs_cards_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      streaks: {
        Row: {
          current_streak: number;
          freezes_available: number;
          last_goal_date: string | null;
          longest_streak: number;
          total_days_met: number;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          current_streak?: number;
          freezes_available?: number;
          last_goal_date?: string | null;
          longest_streak?: number;
          total_days_met?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          current_streak?: number;
          freezes_available?: number;
          last_goal_date?: string | null;
          longest_streak?: number;
          total_days_met?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "streaks_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      _attempt_effort_met: {
        Args: {
          p_attempt: Omit<
            Database["public"]["Tables"]["exercise_attempts"]["Row"],
            Database["public"]["Tables"]["exercise_attempts"]["ComputedFields"]
          >;
        };
        Returns: boolean;
      };
      _complete_attempt: {
        Args: { p_attempt_id: string; p_now: string; p_uid: string };
        Returns: Database["public"]["CompositeTypes"]["attempt_result"];
        SetofOptions: {
          from: "*";
          to: "attempt_result";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      _register_goal_met: {
        Args: { p_today: string; p_uid: string };
        Returns: undefined;
      };
      _roll_pending_goal: {
        Args: { p_today: string; p_uid: string };
        Returns: number;
      };
      _settle_streak: {
        Args: { p_now: string; p_uid: string };
        Returns: {
          current_streak: number;
          freezes_available: number;
          last_goal_date: string | null;
          longest_streak: number;
          total_days_met: number;
          updated_at: string;
          user_id: string;
        };
        SetofOptions: {
          from: "*";
          to: "streaks";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      add_vocab_card: {
        Args: { p_content_id: string };
        Returns: {
          card_type: string;
          content_id: string | null;
          difficulty: number;
          due: string;
          elapsed_days: number;
          error_id: string | null;
          id: string;
          lapses: number;
          last_review: string | null;
          learning_steps: number;
          reps: number;
          scheduled_days: number;
          stability: number;
          state: number;
          suspended: boolean;
          user_id: string;
        };
        SetofOptions: {
          from: "*";
          to: "srs_cards";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      change_daily_goal: {
        Args: { p_minutes: number };
        Returns: {
          accent: string;
          correction_mode: string;
          created_at: string;
          daily_goal_minutes: number;
          display_name: string | null;
          id: string;
          interests: string[];
          new_cards_per_day: number;
          pending_daily_goal: number | null;
          pending_goal_from: string | null;
          playback_rate: number;
          reminder_time: string | null;
          sublevels: NonNullable<Json>;
          timezone: string;
          timezone_changed_at: string | null;
          updated_at: string;
          weekly_goal_days: number;
        };
        SetofOptions: {
          from: "*";
          to: "profiles";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      change_timezone: {
        Args: { p_timezone: string };
        Returns: {
          accent: string;
          correction_mode: string;
          created_at: string;
          daily_goal_minutes: number;
          display_name: string | null;
          id: string;
          interests: string[];
          new_cards_per_day: number;
          pending_daily_goal: number | null;
          pending_goal_from: string | null;
          playback_rate: number;
          reminder_time: string | null;
          sublevels: NonNullable<Json>;
          timezone: string;
          timezone_changed_at: string | null;
          updated_at: string;
          weekly_goal_days: number;
        };
        SetofOptions: {
          from: "*";
          to: "profiles";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      complete_attempt: {
        Args: { p_attempt_id: string };
        Returns: Database["public"]["CompositeTypes"]["attempt_result"];
        SetofOptions: {
          from: "*";
          to: "attempt_result";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      end_session: {
        Args: { p_session_id: string };
        Returns: {
          ended_at: string | null;
          id: string;
          mode: string;
          plan: NonNullable<Json>;
          started_at: string;
          status: string;
          user_id: string;
        };
        SetofOptions: {
          from: "*";
          to: "practice_sessions";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      grade_card: {
        Args: {
          p_answer: string;
          p_card_id: string;
          p_difficulty: number;
          p_due: string;
          p_elapsed_days: number;
          p_lapses: number;
          p_learning_steps: number;
          p_rating: number;
          p_reps: number;
          p_scheduled_days: number;
          p_stability: number;
          p_state: number;
        };
        Returns: {
          card_type: string;
          content_id: string | null;
          difficulty: number;
          due: string;
          elapsed_days: number;
          error_id: string | null;
          id: string;
          lapses: number;
          last_review: string | null;
          learning_steps: number;
          reps: number;
          scheduled_days: number;
          stability: number;
          state: number;
          suspended: boolean;
          user_id: string;
        };
        SetofOptions: {
          from: "*";
          to: "srs_cards";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      settle_streak: {
        Args: Record<PropertyKey, never>;
        Returns: {
          current_streak: number;
          freezes_available: number;
          last_goal_date: string | null;
          longest_streak: number;
          total_days_met: number;
          updated_at: string;
          user_id: string;
        };
        SetofOptions: {
          from: "*";
          to: "streaks";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      skip_attempt: { Args: { p_attempt_id: string }; Returns: undefined };
      start_attempt: {
        Args: {
          p_activity: string;
          p_content_id: string;
          p_session_id: string;
        };
        Returns: string;
      };
      start_session: {
        Args: { p_mode: string; p_plan?: Json };
        Returns: string;
      };
      today_progress: {
        Args: Record<PropertyKey, never>;
        Returns: {
          active_seconds: number;
          goal_minutes: number;
          local_date: string;
          status: string;
          xp: number;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      attempt_result: {
        valid_seconds: number | null;
        xp: number | null;
        active_seconds: number | null;
        goal_minutes: number | null;
        goal_met: boolean | null;
        current_streak: number | null;
        longest_streak: number | null;
        freezes_available: number | null;
      };
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;

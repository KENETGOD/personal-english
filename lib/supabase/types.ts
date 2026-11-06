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
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
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

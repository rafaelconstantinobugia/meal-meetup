export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      dishes: {
        Row: {
          available_date: string
          created_at: string
          description: string | null
          id: string
          image_url: string
          meal_type: Database["public"]["Enums"]["meal_type"]
          mood_tags: string[] | null
          name: string
        }
        Insert: {
          available_date?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url: string
          meal_type: Database["public"]["Enums"]["meal_type"]
          mood_tags?: string[] | null
          name: string
        }
        Update: {
          available_date?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string
          meal_type?: Database["public"]["Enums"]["meal_type"]
          mood_tags?: string[] | null
          name?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          created_at: string
          dish_id: string
          id: string
          meeting_location: string | null
          meeting_time: string | null
          status: Database["public"]["Enums"]["match_status"]
          updated_at: string
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string
          dish_id: string
          id?: string
          meeting_location?: string | null
          meeting_time?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          updated_at?: string
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string
          dish_id?: string
          id?: string
          meeting_location?: string | null
          meeting_time?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          updated_at?: string
          user1_id?: string
          user2_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          id: string
          match_id: string
          sender_id: string
          sent_at: string
        }
        Insert: {
          content: string
          id?: string
          match_id: string
          sender_id: string
          sent_at?: string
        }
        Update: {
          content?: string
          id?: string
          match_id?: string
          sender_id?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          allergies: string[] | null
          availability: Database["public"]["Enums"]["availability"]
          bio: string | null
          city: string
          created_at: string
          food_preferences: string[] | null
          id: string
          name: string
          profile_picture_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allergies?: string[] | null
          availability?: Database["public"]["Enums"]["availability"]
          bio?: string | null
          city: string
          created_at?: string
          food_preferences?: string[] | null
          id?: string
          name: string
          profile_picture_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allergies?: string[] | null
          availability?: Database["public"]["Enums"]["availability"]
          bio?: string | null
          city?: string
          created_at?: string
          food_preferences?: string[] | null
          id?: string
          name?: string
          profile_picture_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_dish_preferences: {
        Row: {
          dish_id: string
          id: string
          liked: boolean
          swiped_at: string
          user_id: string
        }
        Insert: {
          dish_id: string
          id?: string
          liked: boolean
          swiped_at?: string
          user_id: string
        }
        Update: {
          dish_id?: string
          id?: string
          liked?: boolean
          swiped_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_dish_preferences_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      availability: "lunch" | "dinner" | "both"
      match_status:
        | "pending"
        | "matched"
        | "meetup_confirmed"
        | "completed"
        | "cancelled"
      meal_type: "breakfast" | "lunch" | "dinner" | "snack"
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
  public: {
    Enums: {
      availability: ["lunch", "dinner", "both"],
      match_status: [
        "pending",
        "matched",
        "meetup_confirmed",
        "completed",
        "cancelled",
      ],
      meal_type: ["breakfast", "lunch", "dinner", "snack"],
    },
  },
} as const

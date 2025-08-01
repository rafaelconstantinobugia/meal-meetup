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
      feedback: {
        Row: {
          created_at: string
          feedback_text: string | null
          id: string
          match_id: string
          rating: number
          user_id: string
          would_meet_again: boolean | null
        }
        Insert: {
          created_at?: string
          feedback_text?: string | null
          id?: string
          match_id: string
          rating: number
          user_id: string
          would_meet_again?: boolean | null
        }
        Update: {
          created_at?: string
          feedback_text?: string | null
          id?: string
          match_id?: string
          rating?: number
          user_id?: string
          would_meet_again?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      food_photos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_url: string
          is_active: boolean
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          is_active?: boolean
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      match_queue: {
        Row: {
          created_at: string
          dish_id: string
          expires_at: string | null
          id: string
          priority_score: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          dish_id: string
          expires_at?: string | null
          id?: string
          priority_score?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          dish_id?: string
          expires_at?: string | null
          id?: string
          priority_score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_queue_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
        ]
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
      matching_preferences: {
        Row: {
          created_at: string
          id: string
          max_age: number | null
          max_distance_km: number | null
          min_age: number | null
          preferred_meal_times: string[] | null
          same_gender_only: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_age?: number | null
          max_distance_km?: number | null
          min_age?: number | null
          preferred_meal_times?: string[] | null
          same_gender_only?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          max_age?: number | null
          max_distance_km?: number | null
          min_age?: number | null
          preferred_meal_times?: string[] | null
          same_gender_only?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      meetup_coordination: {
        Row: {
          both_users_confirmed: boolean | null
          confirmed_location: string | null
          confirmed_time: string | null
          created_at: string
          emergency_contact_shared: boolean | null
          id: string
          match_id: string
          restaurant_suggestion_id: string | null
          safety_checklist_completed: boolean | null
          updated_at: string
          user1_confirmed: boolean | null
          user2_confirmed: boolean | null
        }
        Insert: {
          both_users_confirmed?: boolean | null
          confirmed_location?: string | null
          confirmed_time?: string | null
          created_at?: string
          emergency_contact_shared?: boolean | null
          id?: string
          match_id: string
          restaurant_suggestion_id?: string | null
          safety_checklist_completed?: boolean | null
          updated_at?: string
          user1_confirmed?: boolean | null
          user2_confirmed?: boolean | null
        }
        Update: {
          both_users_confirmed?: boolean | null
          confirmed_location?: string | null
          confirmed_time?: string | null
          created_at?: string
          emergency_contact_shared?: boolean | null
          id?: string
          match_id?: string
          restaurant_suggestion_id?: string | null
          safety_checklist_completed?: boolean | null
          updated_at?: string
          user1_confirmed?: boolean | null
          user2_confirmed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "meetup_coordination_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: true
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetup_coordination_restaurant_suggestion_id_fkey"
            columns: ["restaurant_suggestion_id"]
            isOneToOne: false
            referencedRelation: "restaurant_suggestions"
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
      mutual_like_counters: {
        Row: {
          count: number
          created_at: string
          liker_id: string
          target_id: string
          updated_at: string
        }
        Insert: {
          count?: number
          created_at?: string
          liker_id: string
          target_id: string
          updated_at?: string
        }
        Update: {
          count?: number
          created_at?: string
          liker_id?: string
          target_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      photo_matches: {
        Row: {
          created_at: string
          id: string
          mutual_likes_count: number
          status: string
          updated_at: string
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mutual_likes_count?: number
          status?: string
          updated_at?: string
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mutual_likes_count?: number
          status?: string
          updated_at?: string
          user1_id?: string
          user2_id?: string
        }
        Relationships: []
      }
      photo_swipes: {
        Row: {
          choice: boolean
          created_at: string
          id: string
          photo_id: string
          swiper_user_id: string
        }
        Insert: {
          choice: boolean
          created_at?: string
          id?: string
          photo_id: string
          swiper_user_id: string
        }
        Update: {
          choice?: boolean
          created_at?: string
          id?: string
          photo_id?: string
          swiper_user_id?: string
        }
        Relationships: []
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
      restaurant_suggestions: {
        Row: {
          created_at: string
          cuisine_type: string | null
          google_place_id: string | null
          id: string
          match_id: string
          price_range: string | null
          rating: number | null
          restaurant_address: string
          restaurant_name: string
          status: string | null
          suggested_by: string
          suggested_time: string | null
        }
        Insert: {
          created_at?: string
          cuisine_type?: string | null
          google_place_id?: string | null
          id?: string
          match_id: string
          price_range?: string | null
          rating?: number | null
          restaurant_address: string
          restaurant_name: string
          status?: string | null
          suggested_by: string
          suggested_time?: string | null
        }
        Update: {
          created_at?: string
          cuisine_type?: string | null
          google_place_id?: string | null
          id?: string
          match_id?: string
          price_range?: string | null
          rating?: number | null
          restaurant_address?: string
          restaurant_name?: string
          status?: string | null
          suggested_by?: string
          suggested_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_suggestions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      swipe_history: {
        Row: {
          action: string
          created_at: string
          dish_id: string
          id: string
          target_user_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          dish_id: string
          id?: string
          target_user_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          dish_id?: string
          id?: string
          target_user_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "swipe_history_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
        ]
      }
      typing_indicators: {
        Row: {
          id: string
          is_typing: boolean
          match_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          is_typing?: boolean
          match_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          is_typing?: boolean
          match_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "typing_indicators_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
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
      calculate_compatibility_score: {
        Args: { user1_id: string; user2_id: string; dish_id: string }
        Returns: number
      }
      confirm_meetup: {
        Args: { p_match_id: string }
        Returns: undefined
      }
      update_typing_indicator: {
        Args: { p_match_id: string; p_is_typing: boolean }
        Returns: undefined
      }
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

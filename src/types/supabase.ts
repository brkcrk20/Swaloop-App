// NOT: Bu dosya normalde `supabase gen types typescript` ile üretilir.
// 21.08.2026'daki RLS/RPC turunda, canlı veritabanına erişim olmadığı için
// aşağıdaki eklemeler ELLE yapıldı (migration dosyalarıyla birebir uyumlu):
//   · profiles.role
//   · trade_offers.rejection_reason, trade_offers.proposed_delivery_method
//   · Functions: is_admin, phone_exists, create_trade_offer,
//     accept_trade_offer, reject_trade_offer, mark_offer_countered,
//     advance_trade
// Migration'lar canlıya uygulandıktan sonra bu dosyayı yeniden üretin:
//   supabase gen types typescript --linked > src/types/supabase.ts

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
    PostgrestVersion: "14.15"
  }
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
      categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
        }
        Relationships: []
      }
      community_posts: {
        Row: {
          author_id: string
          comments_count: number
          content: string
          created_at: string
          id: string
          likes_count: number
          tags: string[]
          title: string
          trade_co2_saved: number | null
          trade_item_given: string | null
          trade_item_received: string | null
        }
        Insert: {
          author_id: string
          comments_count?: number
          content: string
          created_at?: string
          id?: string
          likes_count?: number
          tags?: string[]
          title: string
          trade_co2_saved?: number | null
          trade_item_given?: string | null
          trade_item_received?: string | null
        }
        Update: {
          author_id?: string
          comments_count?: number
          content?: string
          created_at?: string
          id?: string
          likes_count?: number
          tags?: string[]
          title?: string
          trade_co2_saved?: number | null
          trade_item_given?: string | null
          trade_item_received?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          active_trade_offer_id: string | null
          created_at: string
          id: string
          participant_one_id: string
          participant_two_id: string
          related_listing_id: string | null
          updated_at: string
        }
        Insert: {
          active_trade_offer_id?: string | null
          created_at?: string
          id?: string
          participant_one_id: string
          participant_two_id: string
          related_listing_id?: string | null
          updated_at?: string
        }
        Update: {
          active_trade_offer_id?: string | null
          created_at?: string
          id?: string
          participant_one_id?: string
          participant_two_id?: string
          related_listing_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_active_trade_offer_id_fkey"
            columns: ["active_trade_offer_id"]
            isOneToOne: false
            referencedRelation: "trade_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant_one_id_fkey"
            columns: ["participant_one_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant_two_id_fkey"
            columns: ["participant_two_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_related_listing_id_fkey"
            columns: ["related_listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      impact_records: {
        Row: {
          calculated_at: string
          co2e_kg: number
          energy_kwh: number
          id: string
          material_kg: number
          methodology_version: string
          reuse_count: number
          trade_id: string
          waste_kg: number
          water_liters: number
        }
        Insert: {
          calculated_at?: string
          co2e_kg?: number
          energy_kwh?: number
          id?: string
          material_kg?: number
          methodology_version?: string
          reuse_count?: number
          trade_id: string
          waste_kg?: number
          water_liters?: number
        }
        Update: {
          calculated_at?: string
          co2e_kg?: number
          energy_kwh?: number
          id?: string
          material_kg?: number
          methodology_version?: string
          reuse_count?: number
          trade_id?: string
          waste_kg?: number
          water_liters?: number
        }
        Relationships: [
          {
            foreignKeyName: "impact_records_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: true
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_images: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          sort_order: number
          storage_path: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          sort_order?: number
          storage_path: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          sort_order?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_images_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          brand: string | null
          category_id: string | null
          city: string | null
          condition: string | null
          created_at: string
          delivery_options: string[]
          description: string | null
          district: string | null
          favorite_count: number
          id: string
          latitude: number | null
          longitude: number | null
          looking_for: string
          model: string | null
          owner_id: string
          status: string
          tags: string[]
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          brand?: string | null
          category_id?: string | null
          city?: string | null
          condition?: string | null
          created_at?: string
          delivery_options?: string[]
          description?: string | null
          district?: string | null
          favorite_count?: number
          id?: string
          latitude?: number | null
          longitude?: number | null
          looking_for?: string
          model?: string | null
          owner_id: string
          status?: string
          tags?: string[]
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          brand?: string | null
          category_id?: string | null
          city?: string | null
          condition?: string | null
          created_at?: string
          delivery_options?: string[]
          description?: string | null
          district?: string | null
          favorite_count?: number
          id?: string
          latitude?: number | null
          longitude?: number | null
          looking_for?: string
          model?: string | null
          owner_id?: string
          status?: string
          tags?: string[]
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      loop_participants: {
        Row: {
          id: string
          joined_at: string
          loop_id: string
          offering_listing_id: string | null
          role: string
          status: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          loop_id: string
          offering_listing_id?: string | null
          role?: string
          status?: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          loop_id?: string
          offering_listing_id?: string | null
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loop_participants_loop_id_fkey"
            columns: ["loop_id"]
            isOneToOne: false
            referencedRelation: "loops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loop_participants_offering_listing_id_fkey"
            columns: ["offering_listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      loops: {
        Row: {
          category: string
          created_at: string
          creator_id: string
          description: string | null
          id: string
          max_participants: number | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          max_participants?: number | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          max_participants?: number | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
          trade_offer_id: string | null
          type: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
          trade_offer_id?: string | null
          type?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
          trade_offer_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_trade_offer_id_fkey"
            columns: ["trade_offer_id"]
            isOneToOne: false
            referencedRelation: "trade_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string
          district: string | null
          full_name: string | null
          id: string
          interests: string[]
          phone: string
          role: string
          updated_at: string
          username: string | null
          wanted_categories: string[]
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          district?: string | null
          full_name?: string | null
          id: string
          interests?: string[]
          phone: string
          role?: string
          updated_at?: string
          username?: string | null
          wanted_categories?: string[]
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          district?: string | null
          full_name?: string | null
          id?: string
          interests?: string[]
          phone?: string
          role?: string
          updated_at?: string
          username?: string | null
          wanted_categories?: string[]
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          communication_rating: number | null
          created_at: string
          delivery_rating: number | null
          id: string
          item_accuracy_rating: number | null
          rating: number
          reviewed_user_id: string
          reviewer_id: string
          trade_id: string
        }
        Insert: {
          comment?: string | null
          communication_rating?: number | null
          created_at?: string
          delivery_rating?: number | null
          id?: string
          item_accuracy_rating?: number | null
          rating: number
          reviewed_user_id: string
          reviewer_id: string
          trade_id: string
        }
        Update: {
          comment?: string | null
          communication_rating?: number | null
          created_at?: string
          delivery_rating?: number | null
          id?: string
          item_accuracy_rating?: number | null
          rating?: number
          reviewed_user_id?: string
          reviewer_id?: string
          trade_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_reviewed_user_id_fkey"
            columns: ["reviewed_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_events: {
        Row: {
          actor_id: string | null
          created_at: string
          event_type: string
          id: string
          note: string | null
          trade_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          note?: string | null
          trade_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          note?: string | null
          trade_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_events_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_offer_items: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          offer_id: string
          owner_id: string
          role: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          offer_id: string
          owner_id: string
          role: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          offer_id?: string
          owner_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_offer_items_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_offer_items_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "trade_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_offer_items_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_offers: {
        Row: {
          created_at: string
          id: string
          message: string | null
          parent_offer_id: string | null
          proposed_delivery_method: string | null
          receiver_id: string
          rejection_reason: string | null
          sender_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          parent_offer_id?: string | null
          proposed_delivery_method?: string | null
          receiver_id: string
          rejection_reason?: string | null
          sender_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          parent_offer_id?: string | null
          proposed_delivery_method?: string | null
          receiver_id?: string
          rejection_reason?: string | null
          sender_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_offers_parent_offer_id_fkey"
            columns: ["parent_offer_id"]
            isOneToOne: false
            referencedRelation: "trade_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_offers_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_offers_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          completed_at: string | null
          delivery_method: string | null
          delivery_notes: string | null
          id: string
          offer_id: string
          receiver_id: string
          sender_id: string
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          delivery_method?: string | null
          delivery_notes?: string | null
          id?: string
          offer_id: string
          receiver_id: string
          sender_id: string
          started_at?: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          delivery_method?: string | null
          delivery_notes?: string | null
          id?: string
          offer_id?: string
          receiver_id?: string
          sender_id?: string
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "trades_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "trade_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trust_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          note: string | null
          review_id: string | null
          score_change: number | null
          trade_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          note?: string | null
          review_id?: string | null
          score_change?: number | null
          trade_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          note?: string | null
          review_id?: string | null
          score_change?: number | null
          trade_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trust_events_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_events_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trust_profiles: {
        Row: {
          average_rating: number | null
          review_count: number
          cancelled_trades: number
          completed_trades: number
          response_rate: number
          trust_score: number
          updated_at: string
          user_id: string
          verification_level: string
        }
        Insert: {
          average_rating?: number | null
          review_count?: number
          cancelled_trades?: number
          completed_trades?: number
          response_rate?: number
          trust_score?: number
          updated_at?: string
          user_id: string
          verification_level?: string
        }
        Update: {
          average_rating?: number | null
          review_count?: number
          cancelled_trades?: number
          completed_trades?: number
          response_rate?: number
          trust_score?: number
          updated_at?: string
          user_id?: string
          verification_level?: string
        }
        Relationships: [
          {
            foreignKeyName: "trust_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_trade_offer: {
        Args: { p_offer_id: string }
        Returns: string
      }
      advance_trade: {
        Args: {
          p_impact?: Json | null
          p_offer_id: string
          p_target_step: number
        }
        Returns: undefined
      }
      complete_loop: {
        Args: { p_loop_id: string }
        Returns: undefined
      }
      create_trade_offer: {
        Args: {
          p_delivery_method?: string
          p_message?: string | null
          p_offered_listing_ids: string[]
          p_parent_offer_id?: string | null
          p_receiver_id: string
          p_requested_listing_ids: string[]
        }
        Returns: string
      }
      cancel_trade: {
        Args: { p_offer_id: string; p_reason?: string | null }
        Returns: undefined
      }
      get_user_stats: {
        Args: { p_user_id: string }
        Returns: {
          active_listings: number
          completed_trades: number
          completed_loops: number
          co2e_kg: number
          water_liters: number
          energy_kwh: number
          material_kg: number
          waste_kg: number
          items_reused: number
        }[]
      }
      increment_listing_view: {
        Args: { p_listing_id: string }
        Returns: undefined
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_loop_participant: {
        Args: { p_loop_id: string }
        Returns: boolean
      }
      sync_loop_status: {
        Args: { p_loop_id: string }
        Returns: string
      }
      mark_offer_countered: {
        Args: { p_original_offer_id: string }
        Returns: undefined
      }
      phone_exists: {
        Args: { check_phone: string }
        Returns: boolean
      }
      reject_trade_offer: {
        Args: { p_offer_id: string; p_reason?: string | null }
        Returns: undefined
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
    Enums: {},
  },
} as const

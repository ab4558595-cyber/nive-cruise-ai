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
      abuse_log: {
        Row: {
          hits: number
          id: string
          ip: string
          route: string
          updated_at: string
          window_start: string
        }
        Insert: {
          hits?: number
          id?: string
          ip: string
          route: string
          updated_at?: string
          window_start?: string
        }
        Update: {
          hits?: number
          id?: string
          ip?: string
          route?: string
          updated_at?: string
          window_start?: string
        }
        Relationships: []
      }
      ad_campaign_runs: {
        Row: {
          created_at: string
          currency: string
          days: number
          goal: string
          id: string
          landing_url: string
          plan: Json
          results: Json
          status: string
          total_budget: number
          user_id: string
        }
        Insert: {
          created_at?: string
          currency: string
          days: number
          goal: string
          id?: string
          landing_url: string
          plan: Json
          results?: Json
          status?: string
          total_budget: number
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          days?: number
          goal?: string
          id?: string
          landing_url?: string
          plan?: Json
          results?: Json
          status?: string
          total_budget?: number
          user_id?: string
        }
        Relationships: []
      }
      ad_connections: {
        Row: {
          account_id: string | null
          account_name: string | null
          created_at: string
          id: string
          provider: string
          refresh_token: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          account_name?: string | null
          created_at?: string
          id?: string
          provider: string
          refresh_token: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          account_name?: string | null
          created_at?: string
          id?: string
          provider?: string
          refresh_token?: string
          user_id?: string
        }
        Relationships: []
      }
      ad_oauth_states: {
        Row: {
          created_at: string
          provider: string
          state: string
          user_id: string
        }
        Insert: {
          created_at?: string
          provider: string
          state: string
          user_id: string
        }
        Update: {
          created_at?: string
          provider?: string
          state?: string
          user_id?: string
        }
        Relationships: []
      }
      brand_profiles: {
        Row: {
          audience: string | null
          brand_name: string | null
          forbidden_words: string[]
          keywords: string[]
          updated_at: string
          user_id: string
          usp: string | null
          voice: string | null
        }
        Insert: {
          audience?: string | null
          brand_name?: string | null
          forbidden_words?: string[]
          keywords?: string[]
          updated_at?: string
          user_id: string
          usp?: string | null
          voice?: string | null
        }
        Update: {
          audience?: string | null
          brand_name?: string | null
          forbidden_words?: string[]
          keywords?: string[]
          updated_at?: string
          user_id?: string
          usp?: string | null
          voice?: string | null
        }
        Relationships: []
      }
      business_credit_topups: {
        Row: {
          amount_inr: number
          created_at: string
          credits: number
          day: string
          id: string
          pack: string
          tool: string
          user_id: string
        }
        Insert: {
          amount_inr: number
          created_at?: string
          credits: number
          day?: string
          id?: string
          pack: string
          tool: string
          user_id: string
        }
        Update: {
          amount_inr?: number
          created_at?: string
          credits?: number
          day?: string
          id?: string
          pack?: string
          tool?: string
          user_id?: string
        }
        Relationships: []
      }
      business_tool_events: {
        Row: {
          created_at: string
          credits: number
          id: string
          metadata: Json
          tool: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits?: number
          id?: string
          metadata?: Json
          tool: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits?: number
          id?: string
          metadata?: Json
          tool?: string
          user_id?: string
        }
        Relationships: []
      }
      business_tool_usage: {
        Row: {
          count: number
          day: string
          id: string
          tool: string
          updated_at: string
          user_id: string
        }
        Insert: {
          count?: number
          day?: string
          id?: string
          tool: string
          updated_at?: string
          user_id: string
        }
        Update: {
          count?: number
          day?: string
          id?: string
          tool?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_ledger: {
        Row: {
          balance_after: number
          created_at: string
          delta: number
          id: string
          metadata: Json
          reason: string
          tool: string | null
          user_id: string
        }
        Insert: {
          balance_after?: number
          created_at?: string
          delta: number
          id?: string
          metadata?: Json
          reason: string
          tool?: string | null
          user_id: string
        }
        Update: {
          balance_after?: number
          created_at?: string
          delta?: number
          id?: string
          metadata?: Json
          reason?: string
          tool?: string | null
          user_id?: string
        }
        Relationships: []
      }
      credit_wallets: {
        Row: {
          balance: number
          lifetime_granted: number
          lifetime_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          lifetime_granted?: number
          lifetime_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          lifetime_granted?: number
          lifetime_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      marketplace_installs: {
        Row: {
          created_at: string
          id: string
          item_key: string
          listing_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_key: string
          listing_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_key?: string
          listing_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_installs_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_listings: {
        Row: {
          author_id: string
          author_name: string | null
          category: string
          created_at: string
          description: string | null
          homepage: string | null
          id: string
          install_count: number
          is_published: boolean
          kind: string
          name: string
          prompt: string | null
          tagline: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          author_id: string
          author_name?: string | null
          category?: string
          created_at?: string
          description?: string | null
          homepage?: string | null
          id?: string
          install_count?: number
          is_published?: boolean
          kind?: string
          name: string
          prompt?: string | null
          tagline: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          author_id?: string
          author_name?: string | null
          category?: string
          created_at?: string
          description?: string | null
          homepage?: string | null
          id?: string
          install_count?: number
          is_published?: boolean
          kind?: string
          name?: string
          prompt?: string | null
          tagline?: string
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      payment_requests: {
        Row: {
          amount: number
          approval_token: string
          approved_at: string | null
          created_at: string
          id: string
          plan_id: string
          status: string
          transaction_ref: string
          user_email: string
          user_id: string
        }
        Insert: {
          amount: number
          approval_token?: string
          approved_at?: string | null
          created_at?: string
          id?: string
          plan_id: string
          status?: string
          transaction_ref: string
          user_email: string
          user_id: string
        }
        Update: {
          amount?: number
          approval_token?: string
          approved_at?: string | null
          created_at?: string
          id?: string
          plan_id?: string
          status?: string
          transaction_ref?: string
          user_email?: string
          user_id?: string
        }
        Relationships: []
      }
      processed_webhook_events: {
        Row: {
          event_id: string
          processed_at: string
          source: string
        }
        Insert: {
          event_id: string
          processed_at?: string
          source: string
        }
        Update: {
          event_id?: string
          processed_at?: string
          source?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      saved_schemas: {
        Row: {
          created_at: string
          id: string
          kind: string
          name: string
          schema_json: Json
          share_token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          name: string
          schema_json: Json
          share_token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          name?: string
          schema_json?: Json
          share_token?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sitemap_status_snapshots: {
        Row: {
          checked_at: string
          errors: number | null
          fetch_error: string | null
          id: string
          is_pending: boolean | null
          is_sitemaps_index: boolean | null
          last_downloaded: string | null
          last_submitted: string | null
          raw_payload: Json | null
          site_url: string
          sitemap_url: string
          total_indexed: number | null
          total_submitted: number | null
          warnings: number | null
        }
        Insert: {
          checked_at?: string
          errors?: number | null
          fetch_error?: string | null
          id?: string
          is_pending?: boolean | null
          is_sitemaps_index?: boolean | null
          last_downloaded?: string | null
          last_submitted?: string | null
          raw_payload?: Json | null
          site_url: string
          sitemap_url: string
          total_indexed?: number | null
          total_submitted?: number | null
          warnings?: number | null
        }
        Update: {
          checked_at?: string
          errors?: number | null
          fetch_error?: string | null
          id?: string
          is_pending?: boolean | null
          is_sitemaps_index?: boolean | null
          last_downloaded?: string | null
          last_submitted?: string | null
          raw_payload?: Json | null
          site_url?: string
          sitemap_url?: string
          total_indexed?: number | null
          total_submitted?: number | null
          warnings?: number | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          paddle_customer_id: string
          paddle_subscription_id: string
          price_id: string
          product_id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          paddle_customer_id: string
          paddle_subscription_id: string
          price_id: string
          product_id: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          paddle_customer_id?: string
          paddle_subscription_id?: string
          price_id?: string
          product_id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      usage_logs: {
        Row: {
          created_at: string
          day: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_plans: {
        Row: {
          active: boolean
          created_at: string
          expires_at: string
          id: string
          plan_id: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          expires_at: string
          id?: string
          plan_id: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          expires_at?: string
          id?: string
          plan_id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      bump_marketplace_installs: {
        Args: { _listing_id: string }
        Returns: undefined
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      grant_credits: {
        Args: {
          _amount: number
          _metadata?: Json
          _reason: string
          _tool?: string
          _user_id: string
        }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      spend_credits: {
        Args: {
          _amount: number
          _metadata?: Json
          _reason: string
          _tool?: string
          _user_id: string
        }
        Returns: number
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const

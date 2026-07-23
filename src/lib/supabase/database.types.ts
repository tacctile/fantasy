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
      adp_rankings: {
        Row: {
          adp_overall: number
          adp_source: string
          created_at: string
          ingested_at: string
          positional_rank: number | null
          scoring_format: string
          season_year: number
          sleeper_player_id: string
          updated_at: string
        }
        Insert: {
          adp_overall: number
          adp_source: string
          created_at?: string
          ingested_at: string
          positional_rank?: number | null
          scoring_format: string
          season_year: number
          sleeper_player_id: string
          updated_at?: string
        }
        Update: {
          adp_overall?: number
          adp_source?: string
          created_at?: string
          ingested_at?: string
          positional_rank?: number | null
          scoring_format?: string
          season_year?: number
          sleeper_player_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "adp_rankings_sleeper_player_id_fkey"
            columns: ["sleeper_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["sleeper_player_id"]
          },
        ]
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      assessor_data: {
        Row: {
          annual_tax_amount: number | null
          appeal_deadline: string | null
          assessed_date: string | null
          assessed_value: number
          assessment_ratio: number | null
          created_at: string | null
          estimated_market_value: number | null
          id: string
          improvement_value: number | null
          land_value: number | null
          loan_id: string
          notes: string | null
          tax_installment_1: number | null
          tax_installment_1_due: string | null
          tax_installment_2: number | null
          tax_installment_2_due: string | null
          tax_year: number
          user_id: string
        }
        Insert: {
          annual_tax_amount?: number | null
          appeal_deadline?: string | null
          assessed_date?: string | null
          assessed_value: number
          assessment_ratio?: number | null
          created_at?: string | null
          estimated_market_value?: number | null
          id?: string
          improvement_value?: number | null
          land_value?: number | null
          loan_id: string
          notes?: string | null
          tax_installment_1?: number | null
          tax_installment_1_due?: string | null
          tax_installment_2?: number | null
          tax_installment_2_due?: string | null
          tax_year: number
          user_id: string
        }
        Update: {
          annual_tax_amount?: number | null
          appeal_deadline?: string | null
          assessed_date?: string | null
          assessed_value?: number
          assessment_ratio?: number | null
          created_at?: string | null
          estimated_market_value?: number | null
          id?: string
          improvement_value?: number | null
          land_value?: number | null
          loan_id?: string
          notes?: string | null
          tax_installment_1?: number | null
          tax_installment_1_due?: string | null
          tax_installment_2?: number | null
          tax_installment_2_due?: string | null
          tax_year?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessor_data_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loan"
            referencedColumns: ["id"]
          },
        ]
      }
      bh_availability: {
        Row: {
          created_at: string
          date: string
          id: string
          name: string
          status: string
          voter_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          name: string
          status?: string
          voter_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          name?: string
          status?: string
          voter_id?: string
        }
        Relationships: []
      }
      bh_votes: {
        Row: {
          city_id: string
          name: string
          trip_id: string
          updated_at: string
          voter_id: string
        }
        Insert: {
          city_id: string
          name: string
          trip_id?: string
          updated_at?: string
          voter_id: string
        }
        Update: {
          city_id?: string
          name?: string
          trip_id?: string
          updated_at?: string
          voter_id?: string
        }
        Relationships: []
      }
      draft_sessions: {
        Row: {
          activated_at: string | null
          created_at: string
          deactivated_at: string | null
          is_draft_active: boolean
          league_id: string
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          created_at?: string
          deactivated_at?: string | null
          is_draft_active?: boolean
          league_id: string
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          created_at?: string
          deactivated_at?: string | null
          is_draft_active?: boolean
          league_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "draft_sessions_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: true
            referencedRelation: "leagues"
            referencedColumns: ["platform_league_uuid"]
          },
        ]
      }
      draft_state: {
        Row: {
          amount: number | null
          created_at: string
          league_id: string
          native_draft_id: string | null
          native_roster_id: number
          pick_number: number
          platform: Database["public"]["Enums"]["platform"]
          round: number
          season_year: number
          sleeper_player_id: string
          source: Database["public"]["Enums"]["draft_pick_source"]
          updated_at: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          league_id: string
          native_draft_id?: string | null
          native_roster_id: number
          pick_number: number
          platform: Database["public"]["Enums"]["platform"]
          round: number
          season_year: number
          sleeper_player_id: string
          source: Database["public"]["Enums"]["draft_pick_source"]
          updated_at?: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          league_id?: string
          native_draft_id?: string | null
          native_roster_id?: number
          pick_number?: number
          platform?: Database["public"]["Enums"]["platform"]
          round?: number
          season_year?: number
          sleeper_player_id?: string
          source?: Database["public"]["Enums"]["draft_pick_source"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "draft_state_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["platform_league_uuid"]
          },
          {
            foreignKeyName: "draft_state_league_id_native_roster_id_fkey"
            columns: ["league_id", "native_roster_id"]
            isOneToOne: false
            referencedRelation: "rosters"
            referencedColumns: ["league_id", "native_roster_id"]
          },
          {
            foreignKeyName: "draft_state_sleeper_player_id_fkey"
            columns: ["sleeper_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["sleeper_player_id"]
          },
        ]
      }
      elliott_account_settings: {
        Row: {
          account_id: string
          created_at: string
          extra: Json
          floor_label: string
          floor_source_pn: string
          floor_value: number
          id: string
          ink_rate_per_sq_ft: number
          invoice_protection_enabled: boolean
          laminate_rate_per_sq_ft: number
          routing_thresholds: Json
          updated_at: string
        }
        Insert: {
          account_id?: string
          created_at?: string
          extra?: Json
          floor_label?: string
          floor_source_pn: string
          floor_value: number
          id?: string
          ink_rate_per_sq_ft: number
          invoice_protection_enabled?: boolean
          laminate_rate_per_sq_ft: number
          routing_thresholds?: Json
          updated_at?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          extra?: Json
          floor_label?: string
          floor_source_pn?: string
          floor_value?: number
          id?: string
          ink_rate_per_sq_ft?: number
          invoice_protection_enabled?: boolean
          laminate_rate_per_sq_ft?: number
          routing_thresholds?: Json
          updated_at?: string
        }
        Relationships: []
      }
      elliott_audit_log: {
        Row: {
          action: Database["public"]["Enums"]["elliott_audit_action"]
          changed_at: string
          changed_by: string
          changed_fields: Json | null
          id: number
          record_id: string
          table_name: string
        }
        Insert: {
          action: Database["public"]["Enums"]["elliott_audit_action"]
          changed_at?: string
          changed_by?: string
          changed_fields?: Json | null
          id?: never
          record_id: string
          table_name: string
        }
        Update: {
          action?: Database["public"]["Enums"]["elliott_audit_action"]
          changed_at?: string
          changed_by?: string
          changed_fields?: Json | null
          id?: never
          record_id?: string
          table_name?: string
        }
        Relationships: []
      }
      elliott_items: {
        Row: {
          account_id: string
          band_class: Database["public"]["Enums"]["elliott_band_class"] | null
          benchmark_item: string
          cost_version_date: string | null
          created_at: string
          cut_runs: number | null
          date_quoted: string | null
          description: string
          do_not_benchmark: boolean
          do_not_benchmark_reason: string
          downstream_items: string
          first_article_price: number | null
          height_in: number
          id: string
          is_active: boolean
          item_type: string
          label_count: number
          lamination_passes: number | null
          margin_at_qty_20: string
          material_combination_id: string | null
          material_cost_per_unit: number | null
          material_family: string
          model: string
          notes: string
          override_type: string
          part_number: string
          per_label_at_qty_20: number | null
          price_1_9: number | null
          price_10_19: number | null
          price_100_199: number | null
          price_20_49: number | null
          price_200_plus: number | null
          price_50_99: number | null
          pricing_logic: string
          process: string
          spec_sheet_paths: string[] | null
          sq_ft_per_kit: number
          sq_ft_per_label: number
          status: Database["public"]["Enums"]["elliott_item_status"]
          updated_at: string
          width_in: number
        }
        Insert: {
          account_id?: string
          band_class?: Database["public"]["Enums"]["elliott_band_class"] | null
          benchmark_item?: string
          cost_version_date?: string | null
          created_at?: string
          cut_runs?: number | null
          date_quoted?: string | null
          description?: string
          do_not_benchmark?: boolean
          do_not_benchmark_reason?: string
          downstream_items?: string
          first_article_price?: number | null
          height_in: number
          id?: string
          is_active?: boolean
          item_type: string
          label_count?: number
          lamination_passes?: number | null
          margin_at_qty_20?: string
          material_combination_id?: string | null
          material_cost_per_unit?: number | null
          material_family: string
          model?: string
          notes?: string
          override_type?: string
          part_number: string
          per_label_at_qty_20?: number | null
          price_1_9?: number | null
          price_10_19?: number | null
          price_100_199?: number | null
          price_20_49?: number | null
          price_200_plus?: number | null
          price_50_99?: number | null
          pricing_logic?: string
          process?: string
          spec_sheet_paths?: string[] | null
          sq_ft_per_kit: number
          sq_ft_per_label: number
          status: Database["public"]["Enums"]["elliott_item_status"]
          updated_at?: string
          width_in: number
        }
        Update: {
          account_id?: string
          band_class?: Database["public"]["Enums"]["elliott_band_class"] | null
          benchmark_item?: string
          cost_version_date?: string | null
          created_at?: string
          cut_runs?: number | null
          date_quoted?: string | null
          description?: string
          do_not_benchmark?: boolean
          do_not_benchmark_reason?: string
          downstream_items?: string
          first_article_price?: number | null
          height_in?: number
          id?: string
          is_active?: boolean
          item_type?: string
          label_count?: number
          lamination_passes?: number | null
          margin_at_qty_20?: string
          material_combination_id?: string | null
          material_cost_per_unit?: number | null
          material_family?: string
          model?: string
          notes?: string
          override_type?: string
          part_number?: string
          per_label_at_qty_20?: number | null
          price_1_9?: number | null
          price_10_19?: number | null
          price_100_199?: number | null
          price_20_49?: number | null
          price_200_plus?: number | null
          price_50_99?: number | null
          pricing_logic?: string
          process?: string
          spec_sheet_paths?: string[] | null
          sq_ft_per_kit?: number
          sq_ft_per_label?: number
          status?: Database["public"]["Enums"]["elliott_item_status"]
          updated_at?: string
          width_in?: number
        }
        Relationships: [
          {
            foreignKeyName: "elliott_items_material_combination_id_fkey"
            columns: ["material_combination_id"]
            isOneToOne: false
            referencedRelation: "elliott_material_combinations"
            referencedColumns: ["id"]
          },
        ]
      }
      elliott_items_internal: {
        Row: {
          account_id: string
          notes: string | null
          part_number: string
          pricing_logic: string | null
          updated_at: string
        }
        Insert: {
          account_id?: string
          notes?: string | null
          part_number: string
          pricing_logic?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string
          notes?: string | null
          part_number?: string
          pricing_logic?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "elliott_items_internal_part_number_fkey"
            columns: ["part_number"]
            isOneToOne: true
            referencedRelation: "elliott_items"
            referencedColumns: ["part_number"]
          },
        ]
      }
      elliott_material_combination_components: {
        Row: {
          combination_id: string
          component_role: Database["public"]["Enums"]["elliott_component_role"]
          created_at: string
          id: string
          material_id: string
          updated_at: string
          usage_sq_ft_multiplier: number
        }
        Insert: {
          combination_id: string
          component_role: Database["public"]["Enums"]["elliott_component_role"]
          created_at?: string
          id?: string
          material_id: string
          updated_at?: string
          usage_sq_ft_multiplier?: number
        }
        Update: {
          combination_id?: string
          component_role?: Database["public"]["Enums"]["elliott_component_role"]
          created_at?: string
          id?: string
          material_id?: string
          updated_at?: string
          usage_sq_ft_multiplier?: number
        }
        Relationships: [
          {
            foreignKeyName: "elliott_material_combination_components_combination_id_fkey"
            columns: ["combination_id"]
            isOneToOne: false
            referencedRelation: "elliott_material_combinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "elliott_material_combination_components_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "elliott_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      elliott_material_combinations: {
        Row: {
          account_id: string
          created_at: string
          description: string
          id: string
          is_active: boolean
          name: string
          process_type: Database["public"]["Enums"]["elliott_process_type"]
          updated_at: string
        }
        Insert: {
          account_id?: string
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          name: string
          process_type: Database["public"]["Enums"]["elliott_process_type"]
          updated_at?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          name?: string
          process_type?: Database["public"]["Enums"]["elliott_process_type"]
          updated_at?: string
        }
        Relationships: []
      }
      elliott_materials: {
        Row: {
          account_id: string
          adhesive_type: string | null
          color_code: string | null
          color_name: string | null
          compatible_with: Json
          cost_per_linear_ft: number | null
          cost_per_linear_yd: number | null
          cost_per_msi: number | null
          cost_per_roll: number | null
          cost_per_sq_ft: number | null
          created_at: string
          distributor: string | null
          engine_key: string | null
          film_thickness_mil: number | null
          film_type: string | null
          finish: string | null
          id: string
          is_active: boolean
          item_number: string | null
          manufacturer: string | null
          material_family: Database["public"]["Enums"]["elliott_material_family"]
          material_key: string
          max_laminator_width_in: number | null
          notes: string
          pms_note: string | null
          product_code: string | null
          product_name: string | null
          roll_length_ft: number | null
          roll_length_yd: number | null
          roll_width_in: number | null
          thickness_mil: number | null
          updated_at: string
          used_in_items: Json
          verified_date: string | null
        }
        Insert: {
          account_id?: string
          adhesive_type?: string | null
          color_code?: string | null
          color_name?: string | null
          compatible_with?: Json
          cost_per_linear_ft?: number | null
          cost_per_linear_yd?: number | null
          cost_per_msi?: number | null
          cost_per_roll?: number | null
          cost_per_sq_ft?: number | null
          created_at?: string
          distributor?: string | null
          engine_key?: string | null
          film_thickness_mil?: number | null
          film_type?: string | null
          finish?: string | null
          id?: string
          is_active?: boolean
          item_number?: string | null
          manufacturer?: string | null
          material_family: Database["public"]["Enums"]["elliott_material_family"]
          material_key: string
          max_laminator_width_in?: number | null
          notes?: string
          pms_note?: string | null
          product_code?: string | null
          product_name?: string | null
          roll_length_ft?: number | null
          roll_length_yd?: number | null
          roll_width_in?: number | null
          thickness_mil?: number | null
          updated_at?: string
          used_in_items?: Json
          verified_date?: string | null
        }
        Update: {
          account_id?: string
          adhesive_type?: string | null
          color_code?: string | null
          color_name?: string | null
          compatible_with?: Json
          cost_per_linear_ft?: number | null
          cost_per_linear_yd?: number | null
          cost_per_msi?: number | null
          cost_per_roll?: number | null
          cost_per_sq_ft?: number | null
          created_at?: string
          distributor?: string | null
          engine_key?: string | null
          film_thickness_mil?: number | null
          film_type?: string | null
          finish?: string | null
          id?: string
          is_active?: boolean
          item_number?: string | null
          manufacturer?: string | null
          material_family?: Database["public"]["Enums"]["elliott_material_family"]
          material_key?: string
          max_laminator_width_in?: number | null
          notes?: string
          pms_note?: string | null
          product_code?: string | null
          product_name?: string | null
          roll_length_ft?: number | null
          roll_length_yd?: number | null
          roll_width_in?: number | null
          thickness_mil?: number | null
          updated_at?: string
          used_in_items?: Json
          verified_date?: string | null
        }
        Relationships: []
      }
      elliott_pricing_bands: {
        Row: {
          account_id: string
          anchor_pn: string | null
          anchor_price_qty_20: number | null
          anchor_psf_qty_20: number | null
          anchor_sq_ft: number | null
          band_key: string
          created_at: string
          extra: Json
          id: string
          is_active: boolean
          margin_floor_stop_pct: number | null
          margin_floor_warn_pct: number | null
          max_psf_qty_20: number | null
          min_psf_qty_20: number | null
          note: string
          snap_granularity: Json | null
          tier_ratios: Json | null
          tier_template: Json | null
          updated_at: string
        }
        Insert: {
          account_id?: string
          anchor_pn?: string | null
          anchor_price_qty_20?: number | null
          anchor_psf_qty_20?: number | null
          anchor_sq_ft?: number | null
          band_key: string
          created_at?: string
          extra?: Json
          id?: string
          is_active?: boolean
          margin_floor_stop_pct?: number | null
          margin_floor_warn_pct?: number | null
          max_psf_qty_20?: number | null
          min_psf_qty_20?: number | null
          note?: string
          snap_granularity?: Json | null
          tier_ratios?: Json | null
          tier_template?: Json | null
          updated_at?: string
        }
        Update: {
          account_id?: string
          anchor_pn?: string | null
          anchor_price_qty_20?: number | null
          anchor_psf_qty_20?: number | null
          anchor_sq_ft?: number | null
          band_key?: string
          created_at?: string
          extra?: Json
          id?: string
          is_active?: boolean
          margin_floor_stop_pct?: number | null
          margin_floor_warn_pct?: number | null
          max_psf_qty_20?: number | null
          min_psf_qty_20?: number | null
          note?: string
          snap_granularity?: Json | null
          tier_ratios?: Json | null
          tier_template?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      insights: {
        Row: {
          body: string
          created_at: string | null
          data: Json | null
          expires_at: string | null
          id: string
          insight_type: string
          is_dismissed: boolean | null
          is_read: boolean | null
          loan_id: string
          priority: number | null
          title: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          data?: Json | null
          expires_at?: string | null
          id?: string
          insight_type: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          loan_id: string
          priority?: number | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          data?: Json | null
          expires_at?: string | null
          id?: string
          insight_type?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          loan_id?: string
          priority?: number | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insights_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loan"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          created_at: string | null
          customer_name: string
          height_inches: number
          id: string
          job_name: string | null
          labor_cost: number | null
          laminate_id: string | null
          markup_pct: number | null
          material_cost: number | null
          overhead_cost: number | null
          price_per_unit: number | null
          profile_id: string | null
          quantity: number
          status: string | null
          substrate_id: string | null
          total_cost: number | null
          total_price: number | null
          updated_at: string | null
          width_inches: number
        }
        Insert: {
          created_at?: string | null
          customer_name: string
          height_inches: number
          id?: string
          job_name?: string | null
          labor_cost?: number | null
          laminate_id?: string | null
          markup_pct?: number | null
          material_cost?: number | null
          overhead_cost?: number | null
          price_per_unit?: number | null
          profile_id?: string | null
          quantity: number
          status?: string | null
          substrate_id?: string | null
          total_cost?: number | null
          total_price?: number | null
          updated_at?: string | null
          width_inches: number
        }
        Update: {
          created_at?: string | null
          customer_name?: string
          height_inches?: number
          id?: string
          job_name?: string | null
          labor_cost?: number | null
          laminate_id?: string | null
          markup_pct?: number | null
          material_cost?: number | null
          overhead_cost?: number | null
          price_per_unit?: number | null
          profile_id?: string | null
          quantity?: number
          status?: string | null
          substrate_id?: string | null
          total_cost?: number | null
          total_price?: number | null
          updated_at?: string | null
          width_inches?: number
        }
        Relationships: [
          {
            foreignKeyName: "jobs_laminate_id_fkey"
            columns: ["laminate_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "pricing_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_substrate_id_fkey"
            columns: ["substrate_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      league_config: {
        Row: {
          created_at: string
          derived_config: Json
          league_id: string
          roster_settings_raw: Json
          scoring_settings_raw: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          derived_config: Json
          league_id: string
          roster_settings_raw: Json
          scoring_settings_raw: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          derived_config?: Json
          league_id?: string
          roster_settings_raw?: Json
          scoring_settings_raw?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "league_config_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: true
            referencedRelation: "leagues"
            referencedColumns: ["platform_league_uuid"]
          },
        ]
      }
      leagues: {
        Row: {
          created_at: string
          name: string
          native_league_id: string
          owner_id: string | null
          platform: Database["public"]["Enums"]["platform"]
          platform_league_uuid: string
          previous_platform_league_uuid: string | null
          season_year: number
          share_token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          name: string
          native_league_id: string
          owner_id?: string | null
          platform: Database["public"]["Enums"]["platform"]
          platform_league_uuid?: string
          previous_platform_league_uuid?: string | null
          season_year: number
          share_token?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          name?: string
          native_league_id?: string
          owner_id?: string | null
          platform?: Database["public"]["Enums"]["platform"]
          platform_league_uuid?: string
          previous_platform_league_uuid?: string | null
          season_year?: number
          share_token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leagues_previous_platform_league_uuid_fkey"
            columns: ["previous_platform_league_uuid"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["platform_league_uuid"]
          },
        ]
      }
      loan: {
        Row: {
          county: string | null
          created_at: string | null
          current_balance: number
          id: string
          interest_rate: number | null
          loan_number: string | null
          loan_start_date: string
          monthly_escrow: number | null
          monthly_interest: number | null
          monthly_payment: number | null
          monthly_principal: number | null
          notes: string | null
          original_amount: number
          original_term_months: number | null
          prepayment_penalty: boolean | null
          property_address: string | null
          property_city: string | null
          property_state: string | null
          property_zip: string | null
          servicer_address: string | null
          servicer_name: string | null
          servicer_phone: string | null
          servicer_website: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          county?: string | null
          created_at?: string | null
          current_balance: number
          id?: string
          interest_rate?: number | null
          loan_number?: string | null
          loan_start_date: string
          monthly_escrow?: number | null
          monthly_interest?: number | null
          monthly_payment?: number | null
          monthly_principal?: number | null
          notes?: string | null
          original_amount: number
          original_term_months?: number | null
          prepayment_penalty?: boolean | null
          property_address?: string | null
          property_city?: string | null
          property_state?: string | null
          property_zip?: string | null
          servicer_address?: string | null
          servicer_name?: string | null
          servicer_phone?: string | null
          servicer_website?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          county?: string | null
          created_at?: string | null
          current_balance?: number
          id?: string
          interest_rate?: number | null
          loan_number?: string | null
          loan_start_date?: string
          monthly_escrow?: number | null
          monthly_interest?: number | null
          monthly_payment?: number | null
          monthly_principal?: number | null
          notes?: string | null
          original_amount?: number
          original_term_months?: number | null
          prepayment_penalty?: boolean | null
          property_address?: string | null
          property_city?: string | null
          property_state?: string | null
          property_zip?: string | null
          servicer_address?: string | null
          servicer_name?: string | null
          servicer_phone?: string | null
          servicer_website?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      market_data: {
        Row: {
          automation_run_id: string | null
          created_at: string | null
          data: Json | null
          data_date: string
          data_type: string
          id: string
          loan_id: string
          notes: string | null
          source: string
          source_type: string | null
          user_id: string
          value: number | null
        }
        Insert: {
          automation_run_id?: string | null
          created_at?: string | null
          data?: Json | null
          data_date: string
          data_type: string
          id?: string
          loan_id: string
          notes?: string | null
          source: string
          source_type?: string | null
          user_id: string
          value?: number | null
        }
        Update: {
          automation_run_id?: string | null
          created_at?: string | null
          data?: Json | null
          data_date?: string
          data_type?: string
          id?: string
          loan_id?: string
          notes?: string | null
          source?: string
          source_type?: string | null
          user_id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "market_data_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loan"
            referencedColumns: ["id"]
          },
        ]
      }
      matchups: {
        Row: {
          created_at: string
          custom_points: number | null
          effective_points: number | null
          fetched_at: string | null
          is_final: boolean
          is_home: boolean | null
          league_id: string
          matchup_period: number
          native_matchup_id: number | null
          native_roster_id: number
          platform: Database["public"]["Enums"]["platform"]
          points: number | null
          season_year: number
          updated_at: string
          week: number
        }
        Insert: {
          created_at?: string
          custom_points?: number | null
          effective_points?: number | null
          fetched_at?: string | null
          is_final?: boolean
          is_home?: boolean | null
          league_id: string
          matchup_period: number
          native_matchup_id?: number | null
          native_roster_id: number
          platform: Database["public"]["Enums"]["platform"]
          points?: number | null
          season_year: number
          updated_at?: string
          week: number
        }
        Update: {
          created_at?: string
          custom_points?: number | null
          effective_points?: number | null
          fetched_at?: string | null
          is_final?: boolean
          is_home?: boolean | null
          league_id?: string
          matchup_period?: number
          native_matchup_id?: number | null
          native_roster_id?: number
          platform?: Database["public"]["Enums"]["platform"]
          points?: number | null
          season_year?: number
          updated_at?: string
          week?: number
        }
        Relationships: [
          {
            foreignKeyName: "matchups_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["platform_league_uuid"]
          },
          {
            foreignKeyName: "matchups_league_id_native_roster_id_fkey"
            columns: ["league_id", "native_roster_id"]
            isOneToOne: false
            referencedRelation: "rosters"
            referencedColumns: ["league_id", "native_roster_id"]
          },
        ]
      }
      materials: {
        Row: {
          active: boolean | null
          category: string
          cost_per_unit: number
          created_at: string | null
          id: string
          name: string
          notes: string | null
          roll_width_inches: number | null
          sku: string | null
          unit: string
          updated_at: string | null
          vendor: string | null
        }
        Insert: {
          active?: boolean | null
          category: string
          cost_per_unit: number
          created_at?: string | null
          id?: string
          name: string
          notes?: string | null
          roll_width_inches?: number | null
          sku?: string | null
          unit: string
          updated_at?: string | null
          vendor?: string | null
        }
        Update: {
          active?: boolean | null
          category?: string
          cost_per_unit?: number
          created_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          roll_width_inches?: number | null
          sku?: string | null
          unit?: string
          updated_at?: string | null
          vendor?: string | null
        }
        Relationships: []
      }
      overhead: {
        Row: {
          created_at: string | null
          equipment_maintenance: number | null
          id: string
          insurance: number | null
          misc: number | null
          misc_notes: string | null
          monthly_overhead_total: number | null
          quarter: string
          rent: number | null
          shop_hourly_rate: number | null
          software_subscriptions: number | null
          updated_at: string | null
          utilities: number | null
        }
        Insert: {
          created_at?: string | null
          equipment_maintenance?: number | null
          id?: string
          insurance?: number | null
          misc?: number | null
          misc_notes?: string | null
          monthly_overhead_total?: number | null
          quarter: string
          rent?: number | null
          shop_hourly_rate?: number | null
          software_subscriptions?: number | null
          updated_at?: string | null
          utilities?: number | null
        }
        Update: {
          created_at?: string | null
          equipment_maintenance?: number | null
          id?: string
          insurance?: number | null
          misc?: number | null
          misc_notes?: string | null
          monthly_overhead_total?: number | null
          quarter?: string
          rent?: number | null
          shop_hourly_rate?: number | null
          software_subscriptions?: number | null
          updated_at?: string | null
          utilities?: number | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          beginning_balance: number
          created_at: string | null
          ending_balance: number
          escrow_balance: number | null
          escrow_paid: number
          extra_principal: number | null
          fees_charged: number | null
          id: string
          interest_paid: number
          late_fee: number | null
          loan_id: string
          notes: string | null
          payment_amount: number
          payment_date: string | null
          payment_due_date: string
          principal_paid: number
          raw_json: Json | null
          statement_date: string
          suspense_balance: number | null
          user_id: string
          year_to_date_escrow: number | null
          year_to_date_fees: number | null
          year_to_date_interest: number | null
          year_to_date_principal: number | null
          year_to_date_total: number | null
        }
        Insert: {
          beginning_balance: number
          created_at?: string | null
          ending_balance: number
          escrow_balance?: number | null
          escrow_paid: number
          extra_principal?: number | null
          fees_charged?: number | null
          id?: string
          interest_paid: number
          late_fee?: number | null
          loan_id: string
          notes?: string | null
          payment_amount: number
          payment_date?: string | null
          payment_due_date: string
          principal_paid: number
          raw_json?: Json | null
          statement_date: string
          suspense_balance?: number | null
          user_id: string
          year_to_date_escrow?: number | null
          year_to_date_fees?: number | null
          year_to_date_interest?: number | null
          year_to_date_principal?: number | null
          year_to_date_total?: number | null
        }
        Update: {
          beginning_balance?: number
          created_at?: string | null
          ending_balance?: number
          escrow_balance?: number | null
          escrow_paid?: number
          extra_principal?: number | null
          fees_charged?: number | null
          id?: string
          interest_paid?: number
          late_fee?: number | null
          loan_id?: string
          notes?: string | null
          payment_amount?: number
          payment_date?: string | null
          payment_due_date?: string
          principal_paid?: number
          raw_json?: Json | null
          statement_date?: string
          suspense_balance?: number | null
          user_id?: string
          year_to_date_escrow?: number | null
          year_to_date_fees?: number | null
          year_to_date_interest?: number | null
          year_to_date_principal?: number | null
          year_to_date_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loan"
            referencedColumns: ["id"]
          },
        ]
      }
      player_id_crosswalk: {
        Row: {
          created_at: string
          espn_player_id: string | null
          gsis_id: string | null
          pfr_id: string | null
          sleeper_player_id: string
          sportradar_id: string | null
          updated_at: string
          yahoo_id: string | null
        }
        Insert: {
          created_at?: string
          espn_player_id?: string | null
          gsis_id?: string | null
          pfr_id?: string | null
          sleeper_player_id: string
          sportradar_id?: string | null
          updated_at?: string
          yahoo_id?: string | null
        }
        Update: {
          created_at?: string
          espn_player_id?: string | null
          gsis_id?: string | null
          pfr_id?: string | null
          sleeper_player_id?: string
          sportradar_id?: string | null
          updated_at?: string
          yahoo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_id_crosswalk_sleeper_player_id_fkey"
            columns: ["sleeper_player_id"]
            isOneToOne: true
            referencedRelation: "players"
            referencedColumns: ["sleeper_player_id"]
          },
        ]
      }
      player_scores: {
        Row: {
          created_at: string
          fetched_at: string | null
          is_final: boolean
          league_id: string
          native_roster_id: number
          platform: Database["public"]["Enums"]["platform"]
          points: number
          season_year: number
          sleeper_player_id: string
          updated_at: string
          was_starter: boolean
          week: number
        }
        Insert: {
          created_at?: string
          fetched_at?: string | null
          is_final?: boolean
          league_id: string
          native_roster_id: number
          platform: Database["public"]["Enums"]["platform"]
          points: number
          season_year: number
          sleeper_player_id: string
          updated_at?: string
          was_starter: boolean
          week: number
        }
        Update: {
          created_at?: string
          fetched_at?: string | null
          is_final?: boolean
          league_id?: string
          native_roster_id?: number
          platform?: Database["public"]["Enums"]["platform"]
          points?: number
          season_year?: number
          sleeper_player_id?: string
          updated_at?: string
          was_starter?: boolean
          week?: number
        }
        Relationships: [
          {
            foreignKeyName: "player_scores_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["platform_league_uuid"]
          },
          {
            foreignKeyName: "player_scores_league_id_native_roster_id_fkey"
            columns: ["league_id", "native_roster_id"]
            isOneToOne: false
            referencedRelation: "rosters"
            referencedColumns: ["league_id", "native_roster_id"]
          },
          {
            foreignKeyName: "player_scores_sleeper_player_id_fkey"
            columns: ["sleeper_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["sleeper_player_id"]
          },
        ]
      }
      players: {
        Row: {
          birth_date: string | null
          catalog_last_seen_at: string | null
          created_at: string
          fantasy_positions: string[] | null
          first_name: string | null
          full_name: string | null
          injury_status: string | null
          is_active_in_catalog: boolean
          last_name: string | null
          metadata: Json
          position: string | null
          search_full_name: string | null
          search_rank: number | null
          sleeper_player_id: string
          status: string | null
          team: string | null
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          catalog_last_seen_at?: string | null
          created_at?: string
          fantasy_positions?: string[] | null
          first_name?: string | null
          full_name?: string | null
          injury_status?: string | null
          is_active_in_catalog?: boolean
          last_name?: string | null
          metadata?: Json
          position?: string | null
          search_full_name?: string | null
          search_rank?: number | null
          sleeper_player_id: string
          status?: string | null
          team?: string | null
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          catalog_last_seen_at?: string | null
          created_at?: string
          fantasy_positions?: string[] | null
          first_name?: string | null
          full_name?: string | null
          injury_status?: string | null
          is_active_in_catalog?: boolean
          last_name?: string | null
          metadata?: Json
          position?: string | null
          search_full_name?: string | null
          search_rank?: number | null
          sleeper_player_id?: string
          status?: string | null
          team?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pricing_profiles: {
        Row: {
          active: boolean | null
          coefficient_a: number | null
          created_at: string | null
          default_laminate_id: string | null
          default_markup_pct: number | null
          default_setup_minutes: number | null
          default_substrate_id: string | null
          description: string | null
          exponent_b: number | null
          floor_c: number | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          coefficient_a?: number | null
          created_at?: string | null
          default_laminate_id?: string | null
          default_markup_pct?: number | null
          default_setup_minutes?: number | null
          default_substrate_id?: string | null
          description?: string | null
          exponent_b?: number | null
          floor_c?: number | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          coefficient_a?: number | null
          created_at?: string | null
          default_laminate_id?: string | null
          default_markup_pct?: number | null
          default_setup_minutes?: number | null
          default_substrate_id?: string | null
          description?: string | null
          exponent_b?: number | null
          floor_c?: number | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_profiles_default_laminate_id_fkey"
            columns: ["default_laminate_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_profiles_default_substrate_id_fkey"
            columns: ["default_substrate_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      roster_players: {
        Row: {
          created_at: string
          espn_lineup_slot_id: number | null
          league_id: string
          native_roster_id: number
          platform: Database["public"]["Enums"]["platform"]
          season_year: number
          sleeper_player_id: string
          slot: Database["public"]["Enums"]["roster_slot"]
          starter_slot_index: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          espn_lineup_slot_id?: number | null
          league_id: string
          native_roster_id: number
          platform: Database["public"]["Enums"]["platform"]
          season_year: number
          sleeper_player_id: string
          slot: Database["public"]["Enums"]["roster_slot"]
          starter_slot_index?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          espn_lineup_slot_id?: number | null
          league_id?: string
          native_roster_id?: number
          platform?: Database["public"]["Enums"]["platform"]
          season_year?: number
          sleeper_player_id?: string
          slot?: Database["public"]["Enums"]["roster_slot"]
          starter_slot_index?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roster_players_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["platform_league_uuid"]
          },
          {
            foreignKeyName: "roster_players_league_id_native_roster_id_fkey"
            columns: ["league_id", "native_roster_id"]
            isOneToOne: false
            referencedRelation: "rosters"
            referencedColumns: ["league_id", "native_roster_id"]
          },
          {
            foreignKeyName: "roster_players_sleeper_player_id_fkey"
            columns: ["sleeper_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["sleeper_player_id"]
          },
        ]
      }
      rosters: {
        Row: {
          co_owner_native_ids: string[]
          created_at: string
          league_id: string
          native_roster_id: number
          owner_display_name: string | null
          owner_native_id: string | null
          platform: Database["public"]["Enums"]["platform"]
          season_year: number
          team_name: string | null
          updated_at: string
        }
        Insert: {
          co_owner_native_ids?: string[]
          created_at?: string
          league_id: string
          native_roster_id: number
          owner_display_name?: string | null
          owner_native_id?: string | null
          platform: Database["public"]["Enums"]["platform"]
          season_year: number
          team_name?: string | null
          updated_at?: string
        }
        Update: {
          co_owner_native_ids?: string[]
          created_at?: string
          league_id?: string
          native_roster_id?: number
          owner_display_name?: string | null
          owner_native_id?: string | null
          platform?: Database["public"]["Enums"]["platform"]
          season_year?: number
          team_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rosters_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["platform_league_uuid"]
          },
        ]
      }
      scenarios: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_pinned: boolean | null
          loan_id: string
          parameters: Json
          results: Json
          scenario_name: string
          scenario_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_pinned?: boolean | null
          loan_id: string
          parameters: Json
          results: Json
          scenario_name: string
          scenario_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_pinned?: boolean | null
          loan_id?: string
          parameters?: Json
          results?: Json
          scenario_name?: string
          scenario_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scenarios_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loan"
            referencedColumns: ["id"]
          },
        ]
      }
      standings: {
        Row: {
          created_at: string
          league_id: string
          losses: number
          native_roster_id: number
          platform: Database["public"]["Enums"]["platform"]
          points_against: number
          points_for: number
          season_year: number
          ties: number
          updated_at: string
          wins: number
        }
        Insert: {
          created_at?: string
          league_id: string
          losses?: number
          native_roster_id: number
          platform: Database["public"]["Enums"]["platform"]
          points_against?: number
          points_for?: number
          season_year: number
          ties?: number
          updated_at?: string
          wins?: number
        }
        Update: {
          created_at?: string
          league_id?: string
          losses?: number
          native_roster_id?: number
          platform?: Database["public"]["Enums"]["platform"]
          points_against?: number
          points_for?: number
          season_year?: number
          ties?: number
          updated_at?: string
          wins?: number
        }
        Relationships: [
          {
            foreignKeyName: "standings_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["platform_league_uuid"]
          },
          {
            foreignKeyName: "standings_league_id_native_roster_id_fkey"
            columns: ["league_id", "native_roster_id"]
            isOneToOne: true
            referencedRelation: "rosters"
            referencedColumns: ["league_id", "native_roster_id"]
          },
        ]
      }
      supplies_data: {
        Row: {
          data: Json
          id: string
          updated_at: string
        }
        Insert: {
          data?: Json
          id?: string
          updated_at?: string
        }
        Update: {
          data?: Json
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      sync_runs: {
        Row: {
          completed_at: string | null
          counts: Json | null
          created_at: string
          error_summary: string | null
          id: number
          league_id: string | null
          platform: Database["public"]["Enums"]["platform"]
          source: string
          started_at: string
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          counts?: Json | null
          created_at?: string
          error_summary?: string | null
          id?: never
          league_id?: string | null
          platform: Database["public"]["Enums"]["platform"]
          source: string
          started_at: string
          status: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          counts?: Json | null
          created_at?: string
          error_summary?: string | null
          id?: never
          league_id?: string | null
          platform?: Database["public"]["Enums"]["platform"]
          source?: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_runs_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["platform_league_uuid"]
          },
        ]
      }
      todd_conversations: {
        Row: {
          archived_at: string | null
          color_label: string | null
          created_at: string
          favorited_at: string | null
          id: string
          muted_at: string | null
          summary: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          color_label?: string | null
          created_at?: string
          favorited_at?: string | null
          id?: string
          muted_at?: string | null
          summary?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          color_label?: string | null
          created_at?: string
          favorited_at?: string | null
          id?: string
          muted_at?: string | null
          summary?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "todd_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "todd_users"
            referencedColumns: ["id"]
          },
        ]
      }
      todd_doodle_builds: {
        Row: {
          archived_at: string | null
          canvas_state: Json | null
          color_label: string | null
          created_at: string
          drawing_data: string | null
          favorited_at: string | null
          generated_images: Json | null
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          canvas_state?: Json | null
          color_label?: string | null
          created_at?: string
          drawing_data?: string | null
          favorited_at?: string | null
          generated_images?: Json | null
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          canvas_state?: Json | null
          color_label?: string | null
          created_at?: string
          drawing_data?: string | null
          favorited_at?: string | null
          generated_images?: Json | null
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "todd_doodle_builds_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "todd_users"
            referencedColumns: ["id"]
          },
        ]
      }
      todd_flagged_messages: {
        Row: {
          context_summary: string
          conversation_id: string
          conversation_title: string
          created_at: string
          id: string
          message_id: string | null
          read: boolean
          topic_category: string
          user_message: string
        }
        Insert: {
          context_summary: string
          conversation_id: string
          conversation_title: string
          created_at?: string
          id?: string
          message_id?: string | null
          read?: boolean
          topic_category: string
          user_message: string
        }
        Update: {
          context_summary?: string
          conversation_id?: string
          conversation_title?: string
          created_at?: string
          id?: string
          message_id?: string | null
          read?: boolean
          topic_category?: string
          user_message?: string
        }
        Relationships: [
          {
            foreignKeyName: "todd_flagged_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "todd_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "todd_flagged_messages_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "todd_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      todd_html_builds: {
        Row: {
          archived_at: string | null
          color_label: string | null
          created_at: string
          favorited_at: string | null
          html_content: string | null
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          color_label?: string | null
          created_at?: string
          favorited_at?: string | null
          html_content?: string | null
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          color_label?: string | null
          created_at?: string
          favorited_at?: string | null
          html_content?: string | null
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "todd_html_builds_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "todd_users"
            referencedColumns: ["id"]
          },
        ]
      }
      todd_memories: {
        Row: {
          content: string
          created_at: string
          emoji: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          emoji?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          emoji?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "todd_memories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "todd_users"
            referencedColumns: ["id"]
          },
        ]
      }
      todd_messages: {
        Row: {
          content: string
          content_tsv: unknown
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          content_tsv?: unknown
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          content_tsv?: unknown
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "todd_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "todd_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      todd_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      todd_sparks: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "todd_sparks_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "todd_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "todd_sparks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "todd_users"
            referencedColumns: ["id"]
          },
        ]
      }
      todd_users: {
        Row: {
          auth_id: string
          created_at: string
          display_name: string | null
          email: string
          id: string
          role: string
          username: string
        }
        Insert: {
          auth_id: string
          created_at?: string
          display_name?: string | null
          email: string
          id?: string
          role?: string
          username: string
        }
        Update: {
          auth_id?: string
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          role?: string
          username?: string
        }
        Relationships: []
      }
      v2_availability: {
        Row: {
          date: string
          id: string
          status: string
          updated_at: string
          voter_id: string
        }
        Insert: {
          date: string
          id?: string
          status?: string
          updated_at?: string
          voter_id: string
        }
        Update: {
          date?: string
          id?: string
          status?: string
          updated_at?: string
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "v2_availability_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "v2_voters"
            referencedColumns: ["voter_id"]
          },
        ]
      }
      v2_bars: {
        Row: {
          address: string
          city_id: string
          created_at: string
          descriptor: string
          has_food: boolean | null
          id: string
          lat: number | null
          lng: number | null
          name: string
        }
        Insert: {
          address: string
          city_id: string
          created_at?: string
          descriptor: string
          has_food?: boolean | null
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
        }
        Update: {
          address?: string
          city_id?: string
          created_at?: string
          descriptor?: string
          has_food?: boolean | null
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
        }
        Relationships: []
      }
      v2_city_votes: {
        Row: {
          city_id: string
          updated_at: string
          voter_id: string
        }
        Insert: {
          city_id: string
          updated_at?: string
          voter_id: string
        }
        Update: {
          city_id?: string
          updated_at?: string
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "v2_city_votes_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: true
            referencedRelation: "v2_voters"
            referencedColumns: ["voter_id"]
          },
        ]
      }
      v2_food: {
        Row: {
          address: string
          city_id: string
          created_at: string
          descriptor: string
          has_bar: boolean | null
          id: string
          lat: number | null
          lng: number | null
          name: string
        }
        Insert: {
          address: string
          city_id: string
          created_at?: string
          descriptor: string
          has_bar?: boolean | null
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
        }
        Update: {
          address?: string
          city_id?: string
          created_at?: string
          descriptor?: string
          has_bar?: boolean | null
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
        }
        Relationships: []
      }
      v2_hotel_votes: {
        Row: {
          city_id: string
          hotel_name: string
          hotel_place_id: string
          updated_at: string
          voter_id: string
        }
        Insert: {
          city_id: string
          hotel_name: string
          hotel_place_id: string
          updated_at?: string
          voter_id: string
        }
        Update: {
          city_id?: string
          hotel_name?: string
          hotel_place_id?: string
          updated_at?: string
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "v2_hotel_votes_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "v2_voters"
            referencedColumns: ["voter_id"]
          },
        ]
      }
      v2_hotels: {
        Row: {
          address: string
          city_id: string
          created_at: string
          descriptor: string
          distance_note: string | null
          id: string
          lat: number | null
          lng: number | null
          name: string
          price_range: string
          stars: number
        }
        Insert: {
          address: string
          city_id: string
          created_at?: string
          descriptor: string
          distance_note?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          price_range: string
          stars: number
        }
        Update: {
          address?: string
          city_id?: string
          created_at?: string
          descriptor?: string
          distance_note?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          price_range?: string
          stars?: number
        }
        Relationships: []
      }
      v2_locations: {
        Row: {
          display_name: string
          expires_at: string
          lat: number
          lng: number
          muted_ids: string[]
          pin_color: string
          session_id: string | null
          sharing_since: string
          updated_at: string
          voter_id: string
        }
        Insert: {
          display_name: string
          expires_at?: string
          lat: number
          lng: number
          muted_ids?: string[]
          pin_color?: string
          session_id?: string | null
          sharing_since?: string
          updated_at?: string
          voter_id: string
        }
        Update: {
          display_name?: string
          expires_at?: string
          lat?: number
          lng?: number
          muted_ids?: string[]
          pin_color?: string
          session_id?: string | null
          sharing_since?: string
          updated_at?: string
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "v2_locations_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: true
            referencedRelation: "v2_voters"
            referencedColumns: ["voter_id"]
          },
        ]
      }
      v2_message_reactions: {
        Row: {
          created_at: string
          emoji: string
          message_id: string
          voter_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          message_id: string
          voter_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          message_id?: string
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "v2_message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "v2_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "v2_message_reactions_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "v2_voters"
            referencedColumns: ["voter_id"]
          },
        ]
      }
      v2_message_reads: {
        Row: {
          message_id: string
          read_at: string
          voter_id: string
        }
        Insert: {
          message_id: string
          read_at?: string
          voter_id: string
        }
        Update: {
          message_id?: string
          read_at?: string
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "v2_message_reads_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "v2_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "v2_message_reads_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "v2_voters"
            referencedColumns: ["voter_id"]
          },
        ]
      }
      v2_messages: {
        Row: {
          content: string | null
          created_at: string
          id: string
          image_url: string | null
          is_deleted: boolean
          reply_to_id: string | null
          voter_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_deleted?: boolean
          reply_to_id?: string | null
          voter_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_deleted?: boolean
          reply_to_id?: string | null
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "v2_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "v2_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "v2_messages_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "v2_voters"
            referencedColumns: ["voter_id"]
          },
        ]
      }
      v2_push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_agent: string | null
          voter_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_agent?: string | null
          voter_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_agent?: string | null
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "v2_push_subscriptions_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "v2_voters"
            referencedColumns: ["voter_id"]
          },
        ]
      }
      v2_trip: {
        Row: {
          city_id: string | null
          created_at: string
          end_date: string | null
          id: string
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          city_id?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          city_id?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      v2_trip_hotel_assignments: {
        Row: {
          trip_hotel_id: string
          voter_id: string
        }
        Insert: {
          trip_hotel_id: string
          voter_id: string
        }
        Update: {
          trip_hotel_id?: string
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "v2_trip_hotel_assignments_trip_hotel_id_fkey"
            columns: ["trip_hotel_id"]
            isOneToOne: false
            referencedRelation: "v2_trip_hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "v2_trip_hotel_assignments_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "v2_voters"
            referencedColumns: ["voter_id"]
          },
        ]
      }
      v2_trip_hotels: {
        Row: {
          created_at: string
          hotel_name: string
          id: string
          sort_order: number
          trip_id: string
        }
        Insert: {
          created_at?: string
          hotel_name: string
          id?: string
          sort_order?: number
          trip_id: string
        }
        Update: {
          created_at?: string
          hotel_name?: string
          id?: string
          sort_order?: number
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "v2_trip_hotels_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "v2_trip"
            referencedColumns: ["id"]
          },
        ]
      }
      v2_trip_members: {
        Row: {
          trip_status: string
          updated_at: string
          voter_id: string
        }
        Insert: {
          trip_status?: string
          updated_at?: string
          voter_id: string
        }
        Update: {
          trip_status?: string
          updated_at?: string
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "v2_trip_members_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: true
            referencedRelation: "v2_voters"
            referencedColumns: ["voter_id"]
          },
        ]
      }
      v2_voter_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          sort_order: number
          voter_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          sort_order?: number
          voter_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          sort_order?: number
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "v2_voter_notes_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "v2_voters"
            referencedColumns: ["voter_id"]
          },
        ]
      }
      v2_voters: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          is_active: boolean
          name: string
          pin_color: string
          pin_hash: string | null
          pin_plain: string | null
          role: string | null
          updated_at: string
          voter_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          is_active?: boolean
          name: string
          pin_color?: string
          pin_hash?: string | null
          pin_plain?: string | null
          role?: string | null
          updated_at?: string
          voter_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          is_active?: boolean
          name?: string
          pin_color?: string
          pin_hash?: string | null
          pin_plain?: string | null
          role?: string | null
          updated_at?: string
          voter_id?: string
        }
        Relationships: []
      }
      valuations: {
        Row: {
          assessor_year: number | null
          automation_run_id: string | null
          confidence_level: string | null
          created_at: string | null
          estimated_value: number
          id: string
          is_assessor_value: boolean | null
          loan_id: string
          notes: string | null
          source: string
          source_type: string | null
          user_id: string
          valuation_date: string
        }
        Insert: {
          assessor_year?: number | null
          automation_run_id?: string | null
          confidence_level?: string | null
          created_at?: string | null
          estimated_value: number
          id?: string
          is_assessor_value?: boolean | null
          loan_id: string
          notes?: string | null
          source: string
          source_type?: string | null
          user_id: string
          valuation_date: string
        }
        Update: {
          assessor_year?: number | null
          automation_run_id?: string | null
          confidence_level?: string | null
          created_at?: string | null
          estimated_value?: number
          id?: string
          is_assessor_value?: boolean | null
          loan_id?: string
          notes?: string | null
          source?: string
          source_type?: string | null
          user_id?: string
          valuation_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "valuations_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loan"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_share_token: { Args: never; Returns: string }
      is_fantasy_admin: { Args: never; Returns: boolean }
      todd_get_email_by_username: {
        Args: { p_username: string }
        Returns: string
      }
      todd_is_admin: { Args: never; Returns: boolean }
      verify_pricing_password: { Args: { pw: string }; Returns: boolean }
    }
    Enums: {
      draft_pick_source: "manual" | "sleeper_poll" | "espn_poll"
      elliott_audit_action: "insert" | "update" | "delete"
      elliott_band_class:
        | "singles_standard"
        | "singles_sub_scope"
        | "singles_micro"
        | "kit"
        | "cut_vinyl_a"
        | "cut_vinyl_b"
        | "cut_vinyl_c"
        | "tiny_one_off"
      elliott_component_role:
        | "substrate"
        | "laminate"
        | "tape"
        | "ink"
        | "other"
      elliott_item_status:
        | "Quoted"
        | "FA Ordered"
        | "FA Accepted"
        | "In Production"
        | "Active Reorder"
        | "Discontinued"
      elliott_material_family:
        | "cut_vinyl"
        | "print_media"
        | "laminate"
        | "tape"
        | "other"
      elliott_process_type:
        | "cut_vinyl"
        | "printed_laminated"
        | "panel_decal"
        | "other"
      platform: "sleeper" | "espn"
      roster_slot: "starter" | "bench" | "reserve" | "taxi"
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
      draft_pick_source: ["manual", "sleeper_poll", "espn_poll"],
      elliott_audit_action: ["insert", "update", "delete"],
      elliott_band_class: [
        "singles_standard",
        "singles_sub_scope",
        "singles_micro",
        "kit",
        "cut_vinyl_a",
        "cut_vinyl_b",
        "cut_vinyl_c",
        "tiny_one_off",
      ],
      elliott_component_role: ["substrate", "laminate", "tape", "ink", "other"],
      elliott_item_status: [
        "Quoted",
        "FA Ordered",
        "FA Accepted",
        "In Production",
        "Active Reorder",
        "Discontinued",
      ],
      elliott_material_family: [
        "cut_vinyl",
        "print_media",
        "laminate",
        "tape",
        "other",
      ],
      elliott_process_type: [
        "cut_vinyl",
        "printed_laminated",
        "panel_decal",
        "other",
      ],
      platform: ["sleeper", "espn"],
      roster_slot: ["starter", "bench", "reserve", "taxi"],
    },
  },
} as const

/**
 * Database types for the Гуляка schema.
 *
 * Hand-written to match `supabase/migrations/0001_init.sql`. When the schema
 * changes, update this file alongside the SQL. (Switch to `supabase gen types`
 * later if we adopt the CLI workflow.)
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type POIType =
  | "building"
  | "church"
  | "mansion"
  | "soviet"
  | "modernism"
  | "monument"
  | "bridge"
  | "park"
  | "other";

export type ContentStatus = "draft" | "published" | "archived";

export type FactCard = {
  title: string;
  body: string;
};

export type POISources = {
  wikidata_id?: string;
  wikipedia_url?: string;
  osm_id?: string;
  um_mos_url?: string;
  custom?: { label: string; url: string }[];
};

export type Database = {
  public: {
    Tables: {
      pois: {
        Row: {
          id: string;
          slug: string;
          name: string;
          address: string | null;
          geom: unknown;
          type: POIType;
          built_year: number | null;
          architect: string | null;
          short_blurb: string | null;
          long_text: string | null;
          fact_cards: FactCard[];
          cover_image_url: string | null;
          cover_image_credit: string | null;
          sources: POISources;
          status: ContentStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          address?: string | null;
          geom: unknown;
          type: POIType;
          built_year?: number | null;
          architect?: string | null;
          short_blurb?: string | null;
          long_text?: string | null;
          fact_cards?: FactCard[];
          cover_image_url?: string | null;
          cover_image_credit?: string | null;
          sources?: POISources;
          status?: ContentStatus;
        };
        Update: Partial<Database["public"]["Tables"]["pois"]["Insert"]>;
      };
      routes: {
        Row: {
          id: string;
          slug: string;
          title: string;
          summary: string | null;
          theme: string | null;
          duration_min: number | null;
          distance_m: number | null;
          geom: unknown | null;
          cover_image_url: string | null;
          status: ContentStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          summary?: string | null;
          theme?: string | null;
          duration_min?: number | null;
          distance_m?: number | null;
          geom?: unknown | null;
          cover_image_url?: string | null;
          status?: ContentStatus;
        };
        Update: Partial<Database["public"]["Tables"]["routes"]["Insert"]>;
      };
      route_pois: {
        Row: {
          route_id: string;
          poi_id: string;
          order_index: number;
          narration_override: string | null;
        };
        Insert: {
          route_id: string;
          poi_id: string;
          order_index: number;
          narration_override?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["route_pois"]["Insert"]>;
      };
      user_poi_favorites: {
        Row: {
          user_id: string;
          poi_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          poi_id: string;
        };
        Update: never;
      };
      user_route_favorites: {
        Row: {
          user_id: string;
          route_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          route_id: string;
        };
        Update: never;
      };
      user_poi_visits: {
        Row: {
          user_id: string;
          poi_id: string;
          first_visited_at: string;
          last_visited_at: string;
          visit_count: number;
        };
        Insert: {
          user_id: string;
          poi_id: string;
        };
        Update: {
          last_visited_at?: string;
          visit_count?: number;
        };
      };
      user_route_sessions: {
        Row: {
          id: string;
          user_id: string;
          route_id: string;
          started_at: string;
          completed_at: string | null;
          current_poi_index: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          route_id: string;
          current_poi_index?: number;
        };
        Update: {
          completed_at?: string | null;
          current_poi_index?: number;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      pois_in_bbox: {
        Args: {
          west: number;
          south: number;
          east: number;
          north: number;
        };
        Returns: {
          id: string;
          slug: string;
          name: string;
          type: POIType;
          short_blurb: string | null;
          cover_image_url: string | null;
          lng: number;
          lat: number;
        }[];
      };
      pois_nearby: {
        Args: {
          in_lng: number;
          in_lat: number;
          radius_m?: number;
        };
        Returns: {
          id: string;
          slug: string;
          name: string;
          type: POIType;
          built_year: number | null;
          short_blurb: string | null;
          cover_image_url: string | null;
          lng: number;
          lat: number;
          distance_m: number;
        }[];
      };
    };
    Enums: Record<string, never>;
  };
};

export type POIRow = Database["public"]["Tables"]["pois"]["Row"];
export type RouteRow = Database["public"]["Tables"]["routes"]["Row"];
export type POINearby =
  Database["public"]["Functions"]["pois_nearby"]["Returns"][number];
export type POIInBBox =
  Database["public"]["Functions"]["pois_in_bbox"]["Returns"][number];

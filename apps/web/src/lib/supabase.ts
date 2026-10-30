import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

export interface PlaceRecord {
  id: string;
  name: string;
  region: string | null;
  state: string;
  lat: number;
  lng: number;
  geom?: unknown;
  period: string | null;
  type: string | null;
  summary: string | null;
  is_illustrative: boolean;
  created_at: string;
  updated_at: string;
}

export interface HeritageItemRecord {
  id: string;
  place_id: string;
  title: string;
  status: string;
  language: string;
  contributor: string | null;
  is_illustrative: boolean;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      places: {
        Row: PlaceRecord;
        Insert: Partial<PlaceRecord> & Pick<PlaceRecord, "name" | "state" | "lat" | "lng">;
        Update: Partial<PlaceRecord>;
      };
      heritage_items: {
        Row: HeritageItemRecord;
        Insert: Partial<HeritageItemRecord> & Pick<HeritageItemRecord, "place_id" | "title">;
        Update: Partial<HeritageItemRecord>;
      };
    };
  };
}

export const supabase = createClient<Database>(
  supabaseUrl,
  supabasePublishableKey
);


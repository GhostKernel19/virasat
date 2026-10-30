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

export interface MediaRecord {
  id: string;
  item_id: string;
  url: string;
  caption: string | null;
  mime_type: string | null;
  is_illustrative: boolean;
  created_at: string;
}

export interface OCRTextRecord {
  id: string;
  media_id: string;
  original_text: string;
  language: string;
  confidence: number | null;
  lines: unknown;
  is_illustrative: boolean;
  created_at: string;
}

export interface TranslationRecord {
  id: string;
  ocr_id: string;
  language: string;
  text: string;
  model: string | null;
  is_illustrative: boolean;
  created_at: string;
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
      media: {
        Row: MediaRecord;
        Insert: Partial<MediaRecord>;
        Update: Partial<MediaRecord>;
      };
      ocr_texts: {
        Row: OCRTextRecord;
        Insert: Partial<OCRTextRecord>;
        Update: Partial<OCRTextRecord>;
      };
      translations: {
        Row: TranslationRecord;
        Insert: Partial<TranslationRecord>;
        Update: Partial<TranslationRecord>;
      };
    };
  };
}

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey
);

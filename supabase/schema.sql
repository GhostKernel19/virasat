-- =============================================================================
-- Virasat (विरासत) — Supabase / PostgreSQL + PostGIS Schema
-- Track: HC26-CULT01 (A Living Heritage Atlas)
-- =============================================================================

-- Enable required extensions
create extension if not exists "postgis";
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- -----------------------------------------------------------------------------
-- 1. Places (Spatial Heritage Anchors)
-- -----------------------------------------------------------------------------
create table if not exists places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  region text,
  state text not null,
  lat double precision not null,
  lng double precision not null,
  geom geography(point, 4326) not null,
  period text,
  type text,
  summary text,
  is_illustrative boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Comments
comment on table places is 'Geospatial monument and site anchors for the Virasat Heritage Atlas';
comment on column places.geom is 'WGS84 (EPSG:4326) point geometry for spatial queries and bounding-box searches';
comment on column places.is_illustrative is 'Indicates prototype/illustrative mock seed data per AGENTS.md';

-- Spatial & BTree Indexes on places
create index if not exists idx_places_geom on places using gist (geom);
create index if not exists idx_places_state on places (state);
create index if not exists idx_places_type on places (type);
create index if not exists idx_places_name_fts on places using gin (to_tsvector('simple', name));

-- -----------------------------------------------------------------------------
-- 2. Heritage Items (Archival Records, Inscriptions, Oral Histories)
-- -----------------------------------------------------------------------------
create table if not exists heritage_items (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references places(id) on delete cascade,
  title text not null,
  status text not null default 'draft' check (status in ('draft', 'in_review', 'verified', 'published', 'archived')),
  language text not null default 'en',
  contributor text,
  is_illustrative boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table heritage_items is 'Curated heritage records, documents, or oral histories linked to places';

-- Foreign Key & Full-Text Search Indexes on heritage_items
create index if not exists idx_heritage_items_place_id on heritage_items (place_id);
create index if not exists idx_heritage_items_status on heritage_items (status);
create index if not exists idx_heritage_items_language on heritage_items (language);
create index if not exists idx_heritage_items_title_fts on heritage_items using gin (to_tsvector('simple', title));

-- -----------------------------------------------------------------------------
-- 3. Media (Scans, Photographs, Inscriptions, Audio)
-- -----------------------------------------------------------------------------
create table if not exists media (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references heritage_items(id) on delete cascade,
  url text not null,
  caption text,
  mime_type text,
  is_illustrative boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table media is 'Archival scans, photographs, and field audio attached to heritage items';

create index if not exists idx_media_item_id on media (item_id);

-- -----------------------------------------------------------------------------
-- 4. OCR Texts (Document / Inscription Extraction)
-- -----------------------------------------------------------------------------
create table if not exists ocr_texts (
  id uuid primary key default gen_random_uuid(),
  media_id uuid not null references media(id) on delete cascade,
  original_text text not null,
  language text not null default 'mr',
  confidence numeric(5, 4) check (confidence >= 0 and confidence <= 1),
  lines jsonb not null default '[]'::jsonb,
  is_illustrative boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table ocr_texts is 'Extracted OCR text containing line-level bboxes and confidence scores';
comment on column ocr_texts.lines is 'Array of objects: [{ "text": str, "confidence": float, "bbox": [x_min, y_min, x_max, y_max] }]';

create index if not exists idx_ocr_texts_media_id on ocr_texts (media_id);
create index if not exists idx_ocr_texts_language on ocr_texts (language);
create index if not exists idx_ocr_texts_fts on ocr_texts using gin (to_tsvector('simple', original_text));
create index if not exists idx_ocr_texts_lines_jsonb on ocr_texts using gin (lines);

-- -----------------------------------------------------------------------------
-- 5. Translations (Multilingual Interpretations)
-- -----------------------------------------------------------------------------
create table if not exists translations (
  id uuid primary key default gen_random_uuid(),
  ocr_id uuid not null references ocr_texts(id) on delete cascade,
  language text not null default 'en',
  text text not null,
  model text,
  is_illustrative boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table translations is 'Machine and verified human translations of archival OCR records';

create index if not exists idx_translations_ocr_id on translations (ocr_id);
create index if not exists idx_translations_language on translations (language);
create index if not exists idx_translations_fts on translations using gin (to_tsvector('simple', text));

-- -----------------------------------------------------------------------------
-- 6. Tags (Thematic Categorization)
-- -----------------------------------------------------------------------------
create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

comment on table tags is 'Taxonomic classifications (e.g. stepwell, solanki, maratha, inscription)';

create index if not exists idx_tags_name on tags (name);

-- -----------------------------------------------------------------------------
-- 7. Item Tags (Many-to-Many Association)
-- -----------------------------------------------------------------------------
create table if not exists item_tags (
  item_id uuid not null references heritage_items(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (item_id, tag_id)
);

create index if not exists idx_item_tags_tag_id on item_tags (tag_id);

-- -----------------------------------------------------------------------------
-- 8. Processing Jobs (Async Ingestion / OCR / Translation Pipeline)
-- -----------------------------------------------------------------------------
create table if not exists processing_jobs (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references heritage_items(id) on delete cascade,
  stage text not null check (stage in ('ingestion', 'preprocessing', 'ocr', 'translation', 'vector_indexing')),
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  error text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table processing_jobs is 'Execution state tracking for archival processing pipelines';

create index if not exists idx_processing_jobs_item_id on processing_jobs (item_id);
create index if not exists idx_processing_jobs_status on processing_jobs (status);
create index if not exists idx_processing_jobs_stage on processing_jobs (stage);

-- -----------------------------------------------------------------------------
-- Helper Functions & Triggers
-- -----------------------------------------------------------------------------

-- Trigger function to auto-sync geom from lat/lng if geom not set
create or replace function fn_sync_places_geom()
returns trigger as $$
begin
  if new.geom is null and new.lng is not null and new.lat is not null then
    new.geom := st_setsrid(st_makepoint(new.lng, new.lat), 4326)::geography;
  end if;
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create or replace trigger trg_sync_places_geom
before insert or update on places
for each row
execute function fn_sync_places_geom();

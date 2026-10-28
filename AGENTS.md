# Virasat (विरासत) — Agent Guidelines & Permanent Context

> **Hackathon Track:** HC26-CULT01  
> **Core Objective:** Transform unstructured heritage archives into a searchable, interactive, map-first heritage atlas.

---

## 1. Project Overview & Identity

- **Name:** Virasat (विरासत)
- **Concept:** A map-first heritage atlas that indexes, structures, and visualizes cultural heritage assets (monuments, oral histories, archives, architectural sites, intangible heritage).
- **Core Experience:** Spatial discovery through MapLibre GL combined with narrative and archival exploration.

---

## 2. Monorepo Architecture

```
virasat/
├── apps/
│   ├── web/          # Next.js 14 App Router, TypeScript, Tailwind CSS, MapLibre GL, Framer Motion
│   └── api/          # FastAPI (Python), geospatial queries, archive ingestion/processing
├── supabase/         # Postgres + PostGIS database migrations, functions, and storage policies
└── docs/             # Technical specs, schemas, and hackathon documentation
```

### Stack Specifics
- **Frontend (`apps/web`):**
  - Next.js 14 (App Router)
  - TypeScript (Strict Mode)
  - Tailwind CSS configured with custom design tokens
  - MapLibre GL for performant map rendering and spatial layers
  - Framer Motion for micro-interactions and transitions
- **Backend (`apps/api`):**
  - FastAPI with Pydantic v2 schemas
  - GeoJSON / PostGIS spatial query support
  - Ingestion pipeline for unstructured heritage documents and metadata
- **Database & Storage (`supabase/`):**
  - PostgreSQL with PostGIS extension for spatial queries (points, polygons, bounding boxes)
  - Supabase Storage for archival media, imagery, and documents

---

## 3. Design Tokens & Styling Guidelines

### Color Palette
| Token Name   | Hex Value | Semantic Role                                  |
| :----------- | :-------- | :--------------------------------------------- |
| `sand`       | `#F5EFE6` | Primary background, card surfaces, parchment   |
| `terracotta` | `#C65D3B` | Primary accent, call-to-actions, active states |
| `indigo`     | `#2E3A59` | Secondary accent, deep heritage tone, badges   |
| `green`      | `#3F6B5B` | Nature, preserved sites, success states        |
| `gold`       | `#D9A441` | Highlights, badges, architectural markers      |
| `ink`        | `#1F2937` | Primary text, high-contrast headings           |
| `line`       | `#E5DED2` | Borders, subtle dividers, structural outlines  |

### Typography
- **Headings / Display:** `Fraunces` (Editorial serif)
- **UI / Body:** `Inter` (Clean sans-serif)
- **Marathi / Devanagari:** `Mukta`

### Geometry & Radius
- **Border Radius:** Default `8px` (`rounded-lg` / `border-radius: 8px`) across cards, buttons, modals, and map controls.

---

## 4. Localization & Language Rules

1. **Brand Logo:** Marathi by default (**विरासत**).
2. **UI Copy:** English by default across all navigational and functional elements.
3. **Language Switcher:** Global `EN | मराठी` toggle accessible in the header/navigation.
4. **Single Dictionary Architecture:**
   - All UI copy and translations must reside in a **single centralized dictionary file** (e.g., `apps/web/src/lib/i18n/dictionary.ts`).
   - Do not scatter translations or hardcode multilingual strings into disparate components.

---

## 5. Data & Seed Integrity

- **Illustrative Labeling:** All mock, prototype, or synthetic seed records **must be explicitly labeled** as `"illustrative"` in code, database seeds, and UI badges.
- **Geodata Precision:** Ensure valid GeoJSON representations (WGS84 / EPSG:4326) with coordinate pairs formatted as `[longitude, latitude]`.

---

## 6. Engineering & Agent Working Rules

1. **Strict Typing:**
   - No untyped JavaScript; TypeScript strict mode enabled throughout `apps/web`.
   - Comprehensive Pydantic models and type hints for all endpoints and handlers in `apps/api`.
2. **Version Control Discipline:**
   - Small, focused, atomic commits following Conventional Commits (`feat:`, `fix:`, `chore:`, etc.).
   - Stage only relevant files.
3. **Zero Secrets in Git:**
   - Never commit API keys, connection strings, JWT secrets, or `.env` files.
   - Use `.env.example` templates for configuration reference.
4. **Permanent Context Preservation:**
   - Refer to this document before introducing architectural, styling, or localization changes.
   - Keep this document updated as new system conventions are established.

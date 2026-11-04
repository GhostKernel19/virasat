<p align="center">
  <img src="docs/images/banner.webp" alt="Virasat banner" width="100%"/>
</p>

<h1 align="center">विरासत · Virasat</h1>
<p align="center"><b>A living heritage atlas.</b> From archival graveyard to living heritage map.</p>

<p align="center">
  Hackathon HC26-CULT01 · Digital Revitalisation of Unstructured Cultural and Architectural Heritage Archives · Blithchron '27, IIT Gandhinagar
</p>

---

## 1. The problem

Field fellowships produce a constant stream of heritage documentation: stepwell photographs, scans in regional scripts, architectural notes and travel journals. It ends up as static decks, disconnected cloud folders and text reports. This is the **archival graveyard**.

<p align="center"><img src="docs/images/problem.webp" alt="From chaotic archive to a living map" width="85%"/></p>

| What goes wrong today | Consequence |
|---|---|
| Records are scattered across folders and decks | Nobody can find what exists |
| Scans in Devanagari are images, not text | They cannot be searched or read by tools |
| Documents are not tied to a place | The story of a site is split from its location |
| No English reading aid for regional-language sources | Researchers outside the region cannot use them |

## 2. The solution in one paragraph

Virasat is a map-first atlas. A contributor uploads a photo or scan and picks the place it belongs to. A pipeline **reads the Devanagari text (OCR), translates it to English, tags it,** and links it to the place. The public explores places on an interactive map, reads each record with the **original and the translation side by side**, and **searches inside the records** in English or Devanagari.

```mermaid
flowchart LR
  subgraph BEFORE["Before"]
    A1["Photos in folders"]
    A2["Scans as images"]
    A3["Notes in decks"]
  end
  subgraph VIRASAT["Virasat"]
    B1["Upload + pick place"]
    B2["OCR + Translate + Tag"]
    B3["Linked to a map pin"]
  end
  subgraph AFTER["After"]
    C1["Explore on a map"]
    C2["Read original + translation"]
    C3["Search inside records"]
  end
  A1 --> B1
  A2 --> B1
  A3 --> B1
  B1 --> B2 --> B3
  B3 --> C1
  B3 --> C2
  B3 --> C3
```

## 3. A tour of the platform

### Landing and guide
<p align="center"><img src="docs/images/01-landing-cover.webp" width="85%"/></p>
<p align="center"><img src="docs/images/02-landing-guide.webp" width="85%"/></p>

### Explore: the map
Places appear as pins; filter chips narrow the map and the list together; the selected place shows its photo and summary.
<p align="center"><img src="docs/images/03-explore-map.webp" width="85%"/></p>
<p align="center"><img src="docs/images/04-explore-filter.webp" width="85%"/></p>

### Place page: original and translation side by side
<p align="center"><img src="docs/images/05-place-detail.webp" width="85%"/></p>
<p align="center"><img src="docs/images/06-original-vs-translation.webp" width="85%"/></p>

### Contribute: upload with live pipeline status
<p align="center"><img src="docs/images/07-contribute-form.webp" width="85%"/></p>
<p align="center"><img src="docs/images/08-contribute-pipeline.webp" width="85%"/></p>
<p align="center"><img src="docs/images/pipeline.gif" width="70%" alt="Live pipeline"/></p>

### Search inside the records
<p align="center"><img src="docs/images/09-search-english.webp" width="85%"/></p>
<p align="center"><img src="docs/images/10-search-devanagari.webp" width="85%"/></p>

### English and Marathi interface
The interface defaults to English; only the logo is Marathi by default, and the toggle switches the full interface.
<p align="center"><img src="docs/images/11-marathi-toggle.webp" width="85%"/></p>

## 4. How it works: the pipeline

```mermaid
sequenceDiagram
  autonumber
  actor C as Contributor
  participant W as Next.js app
  participant A as FastAPI
  participant S as Supabase Storage
  participant G as Gemini API
  participant D as Postgres + PostGIS

  C->>W: Choose image, title and place
  W->>A: POST /items (multipart)
  A->>S: Store the image
  A->>D: Create item (processing) + media + job rows
  A-->>W: 201 with item id
  par Background task
    A->>G: OCR: read Devanagari lines
    G-->>A: Lines with estimated confidence
    A->>D: Save ocr_texts (stage ocr: done)
    A->>G: Translate lines to English
    G-->>A: English text
    A->>D: Save translations (stage translate: done)
    A->>D: Keyword tags (stage tag: done)
    A->>D: Item status = in_review
  and Live status
    loop every 2 seconds
      W->>A: GET /jobs/{item_id}
      A-->>W: Stage statuses
    end
  end
  W->>A: GET /items/{id}
  A-->>W: Image, lines, translation, tags
```

Every stage writes its own row to `processing_jobs` (pending, running, done or failed, with the error text), which is what the Contribute page polls. A failed stage never fails silently.

### Item lifecycle
```mermaid
stateDiagram-v2
  [*] --> processing: Upload
  processing --> in_review: All stages done
  processing --> failed: A stage fails
  failed --> processing: Retry
  in_review --> published: Approved
```

## 5. System architecture
<p align="center"><img src="docs/images/architecture-overview.webp" alt="Simplified architecture overview" width="90%"/></p>
<p align="center"><i>Simplified overview. The detailed diagram below also shows that the web app reads places and records directly from Supabase, while uploads, job status and search go through FastAPI.</i></p>
```mermaid
flowchart TB
  subgraph Client["Browser"]
    UI["Next.js 14 App Router<br/>TypeScript, Tailwind, GSAP"]
    MAP["MapLibre GL map"]
  end
  subgraph Services["Application tier"]
    API["FastAPI<br/>upload, jobs, search, items"]
    BG["Background pipeline task<br/>OCR, translate, tag"]
  end
  subgraph Data["Supabase"]
    PG[("Postgres + PostGIS")]
    ST[("Storage: uploads bucket")]
  end
  AI["Gemini API<br/>OCR and translation"]
  OSM["OpenStreetMap tiles"]

  UI --> MAP
  MAP --> OSM
  UI -->|"read places and records"| PG
  UI -->|"upload, poll, search"| API
  API --> BG
  BG --> AI
  API --> ST
  API --> PG
  BG --> PG
```

## 6. Data model

```mermaid
erDiagram
  places ||--o{ heritage_items : "has"
  heritage_items ||--o{ media : "has"
  media ||--o{ ocr_texts : "has"
  ocr_texts ||--o{ translations : "has"
  heritage_items ||--o{ processing_jobs : "tracked by"
  heritage_items }o--o{ tags : "tagged with"

  places {
    uuid id PK
    string name
    string state
    float lat
    float lng
    string type
    string period
    string image_url
    string image_credit
  }
  heritage_items {
    uuid id PK
    uuid place_id FK
    string title
    string status
  }
  media {
    uuid id PK
    uuid item_id FK
    string url
  }
  ocr_texts {
    uuid id PK
    uuid media_id FK
    text original_text
    float confidence
    jsonb lines
  }
  translations {
    uuid id PK
    uuid ocr_id FK
    string language
    text text
    string model
  }
  processing_jobs {
    uuid id PK
    uuid item_id FK
    string stage
    string status
    text error
  }
```
<p align="center"><img src="docs/images/13-database.webp" width="80%" alt="Supabase tables"/></p>

Full SQL: [`supabase/schema.sql`](supabase/schema.sql) and [`supabase/seed.sql`](supabase/seed.sql).

## 7. Who uses it and how

```mermaid
journey
  title User journeys
  section Explorer
    Open the map: 5: Explorer
    Filter and pick a place: 4: Explorer
    Read the original and the translation: 5: Explorer
  section Researcher
    Search a word in Devanagari or English: 5: Researcher
    Open the passage on its place page: 4: Researcher
  section Contributor
    Upload a photo and pick a place: 5: Contributor
    Watch the pipeline run: 5: Contributor
    Review the result: 4: Contributor
```

## 8. API

The interactive documentation is generated by FastAPI at `http://localhost:8000/docs`.

<p align="center"><img src="docs/images/12-api-docs.webp" width="80%" alt="FastAPI documentation"/></p>

| Method | Path | Purpose |
|---|---|---|
| GET | `/` | Root health check and service metadata |
| POST | `/items` | Upload an image with title and place, start the background pipeline |
| GET | `/jobs/{item_id}` | Stage-by-stage processing status (polled by Contribute page) |
| GET | `/items/{id}` | Item dossier with image, OCR lines, translation and tags |
| POST | `/items/{id}/retry` | Re-run the background pipeline for an existing item (API endpoint) |
| POST | `/items/{id}/approve` | Moderate and approve an in-review item for published display |
| GET | `/admin/items` | Moderation queue: list items by status (`in_review`, `published`, `all`) |
| GET | `/search?q=&type=&state=` | Search places and OCR passages across English and Devanagari |

## 9. Tech stack and why

| Layer | Choice | Reason |
|---|---|---|
| Web | Next.js 14, TypeScript, Tailwind, GSAP | Fast routing and UI; animation for a calm, archival feel |
| Map | MapLibre GL with OpenStreetMap tiles | No API key or vendor lock-in |
| API | FastAPI (Python) | Typed endpoints and background tasks |
| Database | Supabase Postgres + PostGIS | One store for relational and geospatial data |
| Storage | Supabase Storage | Simple, CDN-ready media hosting |
| AI | Gemini API | Reads Devanagari images and translates in one provider |

### Libraries and APIs used

#### Frontend (`apps/web/package.json`)
| Package | Version | Purpose |
|---|---|---|
| `next` | `14.2.35` | React framework (App Router, dynamic routing, image optimization) |
| `react` & `react-dom` | `^18` | Core UI component model |
| `typescript` | `^5` | Strict static typing across components and data loaders |
| `tailwindcss` | `^3.4.1` | Utility-first CSS styling and custom heritage design tokens |
| `maplibre-gl` | `^6.16.0` | Open-source vector/raster map rendering with custom pin markers |
| `gsap` & `@gsap/react` | `^3.15.0` / `^2.1.2` | Hero Ken Burns zoom, smooth scroll-triggered reveals |
| `framer-motion` | `^14.7.1` | Selected place panel sliding animation and interactive transitions |
| `lucide-react` | `^1.63.0` | Iconography for heritage controls, badges, and statuses |
| `@supabase/supabase-js` | `^2.118.0` | Client SDK for direct Supabase Postgres queries |
| `postcss` | `^8` | CSS post-processing pipeline for Tailwind |
| `eslint` & `eslint-config-next` | `^8` / `14.2.35` | Code quality and Next.js linting rules |

#### Backend (`apps/api/requirements.txt`)
| Package | Version | Purpose |
|---|---|---|
| `fastapi` | `>=0.110.0` | High-performance Python async web framework |
| `uvicorn[standard]` | `>=0.28.0` | Production ASGI server with event loop implementation |
| `google-genai` | `>=2.0.0` | Official Google Gemini SDK for Devanagari OCR and English translation |
| `supabase` | `>=2.3.0` | Supabase Python client for PostGIS queries and Storage uploads |
| `httpx` | `>=0.27.0` | HTTP client for downloading image assets and preflight testing |
| `pydantic` | `>=2.6.0` | Typed request validation and structured API response schemas |
| `Pillow` | `>=10.0.0` | Image verification, decoding, and format inspection |
| `python-multipart` | `>=0.0.9` | Multipart form-data parser for archival image uploads |
| `python-dotenv` | `>=1.0.1` | Environment variable parsing from `.env` |
| `pytest` | `>=8.0.0` | API test suite execution |

## 10. Design decisions

- **Original and translation always side by side.** The AI layer never replaces the source.
- **AI is visible, not magic.** Each stage shows its status, and the confidence is labelled as model-estimated.
- **Every failure is surfaced.** Stage errors are stored and shown, not swallowed.
- **Seed data is labelled ILLUSTRATIVE.** We never present demo content as historical fact.
- **Photos are credited.** Place images are from Wikimedia Commons, listed on the Sources page.

## 11. Scalability path

| Today | At scale |
|---|---|
| Background task in the API process | A queue with horizontally scaled workers |
| One Supabase project | Read replicas for search-heavy reads |
| Keyword search (case-insensitive match) | Postgres full-text, then `pgvector` semantic search |
| Public bucket | CDN in front of storage, signed uploads |
| General-purpose model OCR | Dedicated Indic OCR (PaddleOCR) and IndicTrans2 translation |

The API and web tiers are stateless, so both scale behind a load balancer.

## 12. Honest limitations

- The OCR confidence is **model-estimated, not a measured accuracy**.
- There are **no bounding boxes** yet, so highlighting a line on the scan is not implemented.
- Search is **keyword-based**, not semantic.
- There is **no authentication**; the admin page is a prototype.
- The pipeline retry endpoint is implemented on the API (`POST /items/{id}/retry`), but **not yet wired to an interactive button in the web UI** (users can restart via "Contribute another record").
- Seed places and records are **illustrative**.
- OCR quality depends on image quality; handwriting is harder than print.

## 13. Roadmap

1. Bounding-box OCR with scan-to-text highlighting
2. Dedicated Indic OCR and IndicTrans2
3. Semantic search with pgvector
4. Authentication, roles and a moderation workflow
5. Offline field capture (PWA)
6. 3D digital twins from crowdsourced photos, linked to OCR annotations

## 14. How this maps to the judging criteria

| Criterion | Where to look |
|---|---|
| Technical execution (40%) | A working end-to-end pipeline: upload, OCR, translate, tag, search (sections 3 and 4) |
| Architecture and scalability (30%) | Sections 5, 6 and 11 |
| UI/UX (20%) | Section 3 and the English/Marathi interface |
| Innovation and problem fit (10%) | Sections 1 and 2: the archival graveyard turned into a searchable map |

## 15. Run it locally

**Requirements:** Node 18.17+, Python 3.10+, a Supabase project and a Gemini API key.

1. In Supabase, run `supabase/schema.sql` and then `supabase/seed.sql` in the SQL Editor, and create a public Storage bucket named `uploads`.
2. Create `apps/web/.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
NEXT_PUBLIC_API_URL=http://localhost:8000
```
3. Create `apps/api/.env`:
```
GEMINI_API_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```
4. Start the API:
```
cd apps/api
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --port 8000
```
5. Start the web app in a second terminal:
```
cd apps/web
npm install
npm run dev
```
6. Open http://localhost:3000.

## 16. Repository structure

```
virasat/
├── apps/
│   ├── web/          Next.js app (pages, components, i18n, map)
│   └── api/          FastAPI service and OCR pipeline
├── supabase/         schema.sql and seed.sql
├── docs/             architecture notes and README images
└── README.md
```

## 17. Credits
Banner, problem and architecture illustrations were generated with AI and are artistic impressions, not photographs of the sites. Place photographs are from Wikimedia Commons.

Map data © OpenStreetMap contributors. Place photographs from Wikimedia Commons; individual credits are on the Sources page. Built for HC26-CULT01.
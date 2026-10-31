# Virasat (विरासत) — Backend API (`apps/api`)

FastAPI backend service powering the Virasat Heritage Atlas. Handles archival media ingestion, asynchronous multi-stage processing pipelines (OCR, English translation, taxonomy tagging), and PostGIS spatial heritage indexing.

---

## Prerequisites

- **Python 3.10+** (Python 3.12 / 3.14 tested)
- **Windows PowerShell**

---

## Setup & Execution (Windows PowerShell)

Run the following commands in **Windows PowerShell** from the root repository or from `apps/api`:

### 1. Navigate to `apps/api`
```powershell
cd apps\api
```

### 2. Create Python Virtual Environment
```powershell
python -m venv .venv
```

### 3. Activate Virtual Environment
```powershell
.\.venv\Scripts\Activate.ps1
```
*(If PowerShell restricts script execution, run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process` first)*

### 4. Install Dependencies
```powershell
pip install -r requirements.txt
```

### 5. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your credentials:
```powershell
Copy-Item .env.example .env
```

Ensure `.env` contains:
```ini
GEMINI_API_KEY=your_gemini_api_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

### 6. Run FastAPI Server with Uvicorn
Start the Uvicorn server on port `8000`:
```powershell
uvicorn main:app --reload --port 8000
```

The API will be available at:
- **Interactive OpenAPI Documentation (Swagger):** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Alternative Documentation (ReDoc):** [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check:** [http://localhost:8000/](http://localhost:8000/)

---

## Running Tests

To run pytest for the JSON-parsing helper:

```powershell
pytest test_json_parser.py -v
```

Or from the repository root:
```powershell
.\apps\api\.venv\Scripts\pytest apps\api\test_json_parser.py -v
```

---

## API Endpoints

### 1. `POST /items` (Multipart Form Upload)
Uploads an archival image to the public Supabase Storage bucket `uploads`, inserts a `heritage_items` row and `media` row, and triggers the asynchronous 4-stage pipeline.

- **Parameters:**
  - `image` (File, required): Image file (`.jpg`, `.png`, etc.)
  - `title` (Form text, required): Title or inscription description
  - `place_id` (Form text, optional): UUID of anchor site from `places` table
- **Response (`201 Created`):**
  ```json
  {
    "id": "b1111111-1111-1111-1111-111111111111",
    "title": "Adalaj Stepwell Inscription",
    "status": "processing",
    "place_id": "22222222-2222-4222-a222-222222222222",
    "media_url": "https://<supabase-url>/storage/v1/object/public/uploads/<uuid>.jpg"
  }
  ```

### 2. `GET /jobs/{item_id}`
Retrieves the execution status for all pipeline stages linked to a heritage item.

- **Response (`200 OK`):**
  ```json
  [
    {
      "id": "...",
      "item_id": "...",
      "stage": "ocr",
      "status": "done",
      "error": null
    },
    {
      "id": "...",
      "item_id": "...",
      "stage": "translate",
      "status": "done",
      "error": null
    },
    {
      "id": "...",
      "item_id": "...",
      "stage": "tag",
      "status": "done",
      "error": null
    },
    {
      "id": "...",
      "item_id": "...",
      "stage": "finish",
      "status": "done",
      "error": null
    }
  ]
  ```

### 3. `GET /items/{id}`
Retrieves the complete heritage item record along with its associated media, line-level OCR extractions, English translations, and taxonomic tags.

---

## Background Processing Pipeline Stages

1. **`ocr`**: Transcribes Devanagari / Marathi / Sanskrit text using Gemini API (`gemini-2.5-flash`), parses strict line-level JSON with confidence scores, and stores to `ocr_texts`.
2. **`translate`**: Translates extracted lines into English using Gemini, recording model provenance in `translations`.
3. **`tag`**: Classifies thematic taxonomies (`stepwell`, `fort`, `temple`, `inscription`) and associates them via `item_tags`.
4. **`finish`**: Updates heritage item status to `'needs_review'` (or `'in_review'`).


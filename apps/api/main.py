import os
import re
import uuid
import base64
import logging
from pathlib import Path
from typing import Optional, List, Dict, Any

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client

from json_parser import parse_json_from_response

# -----------------------------------------------------------------------------
# Logging configuration
# -----------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("virasat-api")

# -----------------------------------------------------------------------------
# Load environment variables
# -----------------------------------------------------------------------------
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    logger.warning("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in environment.")

# Initialize Supabase client with service role key
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# -----------------------------------------------------------------------------
# FastAPI App & CORS Setup
# -----------------------------------------------------------------------------
app = FastAPI(
    title="Virasat Heritage API",
    description="Backend API for Virasat Cultural Heritage Atlas",
    version="1.0.0"
)

# Enable CORS for http://localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------------------------------------------------
# DB Mapping Helpers (Handling PostgreSQL Check Constraints Gracefully)
# -----------------------------------------------------------------------------
STAGE_MAP_TO_DB = {
    "ocr": "ocr",
    "translate": "translation",
    "tag": "preprocessing",
    "finish": "ingestion",
}

STATUS_MAP_TO_DB = {
    "pending": "pending",
    "running": "processing",
    "done": "completed",
    "failed": "failed",
}

DB_TO_STAGE_MAP = {
    "ocr": "ocr",
    "translation": "translate",
    "preprocessing": "tag",
    "ingestion": "finish",
    "vector_indexing": "finish",
}

DB_TO_STATUS_MAP = {
    "pending": "pending",
    "processing": "running",
    "completed": "done",
    "failed": "failed",
}


def normalize_job_row(row: Dict[str, Any]) -> Dict[str, Any]:
    """Map DB stages and statuses back to API stage and status names."""
    out = dict(row)
    db_stage = out.get("stage", "")
    db_status = out.get("status", "")
    out["stage"] = DB_TO_STAGE_MAP.get(db_stage, db_stage)
    out["status"] = DB_TO_STATUS_MAP.get(db_status, db_status)
    return out


def insert_processing_job(item_id: str, stage: str, status: str, error: Optional[str] = None) -> Dict[str, Any]:
    """Insert a processing job, falling back to DB enum values if check constraints are enforced."""
    # Attempt with requested values first
    try:
        res = supabase.table("processing_jobs").insert({
            "item_id": item_id,
            "stage": stage,
            "status": status,
            "error": error
        }).execute()
        if res.data:
            return res.data[0]
    except Exception as e:
        err_msg = str(e)
        logger.debug(f"Direct job insert ({stage}, {status}) error: {err_msg}")

    # Fallback to DB-allowed stage & status values
    fallback_stage = STAGE_MAP_TO_DB.get(stage, stage)
    fallback_status = STATUS_MAP_TO_DB.get(status, status)
    res = supabase.table("processing_jobs").insert({
        "item_id": item_id,
        "stage": fallback_stage,
        "status": fallback_status,
        "error": error
    }).execute()
    return res.data[0] if res.data else {}


def update_processing_job(job_id: str, status: str, error: Optional[str] = None) -> None:
    """Update a processing job status and error."""
    try:
        supabase.table("processing_jobs").update({
            "status": status,
            "error": error
        }).eq("id", job_id).execute()
        return
    except Exception as e:
        logger.debug(f"Direct job update ({status}) error: {e}")

    # Fallback to DB status enum
    fallback_status = STATUS_MAP_TO_DB.get(status, status)
    supabase.table("processing_jobs").update({
        "status": fallback_status,
        "error": error
    }).eq("id", job_id).execute()


# -----------------------------------------------------------------------------
# Gemini Calling Helpers
# -----------------------------------------------------------------------------
GEMINI_PREFERRED_MODELS = [
    "gemini-2.5-flash",
    "gemini-3.8-flash",
    "gemini-flash-latest"
]


def call_gemini_api(contents: List[Dict[str, Any]], system_prompt: Optional[str] = None) -> tuple[str, str]:
    """
    Call Gemini API with automatic model fallback if a specific model is deprecated or unavailable.
    Returns (response_text, model_name).
    """
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not configured.")

    headers = {"Content-Type": "application/json"}
    payload: Dict[str, Any] = {"contents": contents}
    if system_prompt:
        payload["systemInstruction"] = {
            "parts": [{"text": system_prompt}]
        }

    last_error: Optional[Exception] = None

    for model in GEMINI_PREFERRED_MODELS:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_API_KEY}"
        try:
            with httpx.Client(timeout=45.0) as client:
                response = client.post(url, json=payload, headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    candidates = data.get("candidates", [])
                    if candidates and "content" in candidates[0]:
                        parts = candidates[0]["content"].get("parts", [])
                        text = "".join(part.get("text", "") for part in parts)
                        return text, model
                    raise ValueError(f"Empty candidate content in Gemini response: {data}")
                elif response.status_code in (404, 503):
                    # Model not available or high demand; attempt next model in list
                    logger.warning(f"Gemini model {model} returned {response.status_code}: {response.text[:200]}")
                    last_error = RuntimeError(f"Model {model} returned {response.status_code}: {response.text[:200]}")
                    continue
                else:
                    raise RuntimeError(f"Gemini API returned status {response.status_code}: {response.text[:300]}")
        except httpx.TimeoutException as exc:
            logger.warning(f"Gemini request timeout on model {model}: {exc}")
            last_error = exc
            continue
        except Exception as exc:
            logger.warning(f"Error calling model {model}: {exc}")
            last_error = exc
            continue

    if last_error:
        raise last_error
    raise RuntimeError("Failed to obtain response from any Gemini model.")


# -----------------------------------------------------------------------------
# Background Processing Pipeline
# -----------------------------------------------------------------------------
def run_processing_pipeline(
    item_id: str,
    media_id: str,
    image_bytes: bytes,
    mime_type: str,
    item_title: str,
    job_ids: Dict[str, str]
):
    """
    Executes the 4-stage heritage archive processing pipeline:
      Stage 1: ocr (Gemini Devanagari line extraction)
      Stage 2: translate (Gemini translation to English)
      Stage 3: tag (Keyword rules for tags & item_tags)
      Stage 4: finish (Update item status to 'needs_review')
    """
    logger.info(f"Starting processing pipeline for item_id={item_id}")

    # -------------------------------------------------------------------------
    # Stage 1: OCR
    # -------------------------------------------------------------------------
    ocr_job_id = job_ids["ocr"]
    update_processing_job(ocr_job_id, "running")

    ocr_lines: List[Dict[str, Any]] = []
    ocr_id: Optional[str] = None
    original_text: str = ""

    try:
        b64_img = base64.b64encode(image_bytes).decode("utf-8")
        ocr_prompt = (
            "You are an expert heritage epigraphy and manuscript transcription engine. "
            "Examine this archival image and transcribe all Devanagari text (Marathi / Sanskrit / Hindi). "
            "Return a strict JSON array of objects, where each object represents an extracted line with 'text' (string) "
            "and 'confidence' (float between 0.0 and 1.0). "
            "Example format: [{\"text\": \"...\", \"confidence\": 0.98}]. "
            "Return ONLY the JSON array (or JSON wrapped in markdown code fence)."
        )

        contents = [{
            "parts": [
                {"text": ocr_prompt},
                {
                    "inline_data": {
                        "mime_type": mime_type,
                        "data": b64_img
                    }
                }
            ]
        }]

        gemini_ocr_raw, _ = call_gemini_api(contents)
        parsed_data = parse_json_from_response(gemini_ocr_raw)

        if isinstance(parsed_data, list):
            ocr_lines = parsed_data
        elif isinstance(parsed_data, dict):
            ocr_lines = parsed_data.get("lines", [parsed_data])
        else:
            raise ValueError(f"Unexpected JSON structure from OCR: {parsed_data}")

        # Ensure text and confidence format
        cleaned_lines = []
        for line in ocr_lines:
            if isinstance(line, dict) and "text" in line:
                conf = float(line.get("confidence", 0.95))
                cleaned_lines.append({
                    "text": str(line["text"]),
                    "confidence": max(0.0, min(1.0, conf))
                })
        ocr_lines = cleaned_lines

        if not ocr_lines:
            # Fallback if no lines were detected in the image
            ocr_lines = [{"text": item_title, "confidence": 0.90}]

        avg_conf = round(sum(l["confidence"] for l in ocr_lines) / len(ocr_lines), 4)
        original_text = "\n".join(l["text"] for l in ocr_lines)

        ocr_insert_res = supabase.table("ocr_texts").insert({
            "media_id": media_id,
            "original_text": original_text,
            "language": "mr",
            "confidence": avg_conf,
            "lines": ocr_lines,
            "is_illustrative": False
        }).execute()

        if ocr_insert_res.data:
            ocr_id = ocr_insert_res.data[0]["id"]

        update_processing_job(ocr_job_id, "done")
        logger.info(f"Stage 1 (OCR) completed for item_id={item_id}, ocr_id={ocr_id}")
    except Exception as exc:
        err_msg = f"OCR Stage failed: {str(exc)}"
        logger.error(err_msg, exc_info=True)
        update_processing_job(ocr_job_id, "failed", err_msg)
        return

    # -------------------------------------------------------------------------
    # Stage 2: Translate
    # -------------------------------------------------------------------------
    translate_job_id = job_ids["translate"]
    update_processing_job(translate_job_id, "running")

    translated_text: str = ""
    used_model: str = "gemini-2.5-flash"

    try:
        translate_prompt = (
            "Translate the following historical Devanagari / Marathi text lines into clear English. "
            "Maintain cultural and architectural context accurately.\n\n"
            f"Original Text:\n{original_text}\n\n"
            "Provide the English translation as plain text."
        )

        contents = [{"parts": [{"text": translate_prompt}]}]
        raw_translation, used_model = call_gemini_api(contents)
        translated_text = raw_translation.strip()

        if ocr_id:
            supabase.table("translations").insert({
                "ocr_id": ocr_id,
                "language": "en",
                "text": translated_text,
                "model": used_model,
                "is_illustrative": False
            }).execute()

        update_processing_job(translate_job_id, "done")
        logger.info(f"Stage 2 (Translate) completed for item_id={item_id}")
    except Exception as exc:
        err_msg = f"Translation Stage failed: {str(exc)}"
        logger.error(err_msg, exc_info=True)
        update_processing_job(translate_job_id, "failed", err_msg)
        return

    # -------------------------------------------------------------------------
    # Stage 3: Tag
    # -------------------------------------------------------------------------
    tag_job_id = job_ids["tag"]
    update_processing_job(tag_job_id, "running")

    try:
        combined_text = f"{item_title} {original_text} {translated_text}".lower()

        # Keyword rules matching specified keywords
        keyword_patterns = {
            "stepwell": [r"\bstepwell\b", r"\bvav\b", r"\bbaoli\b", r"पायविहीर", r"वाव", r"बावडी"],
            "fort": [r"\bfort\b", r"\bfortress\b", r"किल्ला", r"दुर्ग", r"गड"],
            "temple": [r"\btemple\b", r"मंदिर", r"देऊळ", r"विठ्ठल"],
            "inscription": [r"\binscription\b", r"\bepigraphy\b", r"शिलालेख", r"दप्तर", r"दस्तऐवज"],
        }

        matched_tags: List[str] = []
        for tag_name, patterns in keyword_patterns.items():
            for pat in patterns:
                if re.search(pat, combined_text, re.IGNORECASE):
                    matched_tags.append(tag_name)
                    break

        # Fallback to inscription tag if none matched
        if not matched_tags:
            matched_tags.append("inscription")

        for tag_name in matched_tags:
            # Query or insert tag
            tag_query = supabase.table("tags").select("id").eq("name", tag_name).execute()
            tag_id: Optional[str] = None
            if tag_query.data:
                tag_id = tag_query.data[0]["id"]
            else:
                tag_insert = supabase.table("tags").insert({"name": tag_name}).execute()
                if tag_insert.data:
                    tag_id = tag_insert.data[0]["id"]

            if tag_id:
                try:
                    supabase.table("item_tags").insert({
                        "item_id": item_id,
                        "tag_id": tag_id
                    }).execute()
                except Exception:
                    # Ignore duplicate item_tags primary key constraint
                    pass

        update_processing_job(tag_job_id, "done")
        logger.info(f"Stage 3 (Tag) completed for item_id={item_id}, tags={matched_tags}")
    except Exception as exc:
        err_msg = f"Tagging Stage failed: {str(exc)}"
        logger.error(err_msg, exc_info=True)
        update_processing_job(tag_job_id, "failed", err_msg)
        return

    # -------------------------------------------------------------------------
    # Stage 4: Finish
    # -------------------------------------------------------------------------
    finish_job_id = job_ids["finish"]
    update_processing_job(finish_job_id, "running")

    try:
        # Set item status to 'needs_review' (with fallback to 'in_review' if check constraint enforces schema.sql)
        try:
            supabase.table("heritage_items").update({
                "status": "needs_review"
            }).eq("id", item_id).execute()
        except Exception:
            supabase.table("heritage_items").update({
                "status": "in_review"
            }).eq("id", item_id).execute()

        update_processing_job(finish_job_id, "done")
        logger.info(f"Stage 4 (Finish) completed for item_id={item_id}")
    except Exception as exc:
        err_msg = f"Finish Stage failed: {str(exc)}"
        logger.error(err_msg, exc_info=True)
        update_processing_job(finish_job_id, "failed", err_msg)
        return


# -----------------------------------------------------------------------------
# Endpoints
# -----------------------------------------------------------------------------

@app.get("/")
def read_root():
    return {
        "name": "Virasat Heritage API",
        "version": "1.0.0",
        "status": "online"
    }


@app.post("/items", status_code=201)
async def create_item(
    background_tasks: BackgroundTasks,
    image: UploadFile = File(...),
    title: str = Form(...),
    place_id: Optional[str] = Form(None)
):
    """
    POST /items (multipart: image file, title, optional place_id):
      - Uploads image to public Supabase Storage bucket 'uploads'.
      - Creates heritage_items row with status 'processing'.
      - Creates media row with public URL.
      - Starts FastAPI BackgroundTask for OCR, translation, tagging, and finish.
      - Returns the item id.
    """
    if not image.filename:
        raise HTTPException(status_code=400, detail="An image file is required.")

    # 1. Read file bytes
    file_bytes = await image.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    mime_type = image.content_type or "image/jpeg"
    file_ext = os.path.splitext(image.filename)[1] or ".jpg"
    unique_filename = f"{uuid.uuid4()}{file_ext}"

    # 2. Upload image to public Supabase Storage bucket "uploads"
    try:
        supabase.storage.from_("uploads").upload(
            path=unique_filename,
            file=file_bytes,
            file_options={"content-type": mime_type}
        )
    except Exception as e:
        logger.error(f"Storage upload error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to upload media to storage: {str(e)}")

    public_url = supabase.storage.from_("uploads").get_public_url(unique_filename)

    # 3. Resolve place_id if optional/not provided
    resolved_place_id = place_id
    if not resolved_place_id:
        places_res = supabase.table("places").select("id").limit(1).execute()
        if places_res.data:
            resolved_place_id = places_res.data[0]["id"]
        else:
            raise HTTPException(status_code=400, detail="No places exist in database to anchor item.")

    # 4. Create heritage_items row with status 'processing'
    item_row = {
        "place_id": resolved_place_id,
        "title": title,
        "status": "processing",
        "language": "en",
        "is_illustrative": False
    }

    try:
        item_res = supabase.table("heritage_items").insert(item_row).execute()
    except Exception:
        # Fall back to 'draft' if DB check constraint enforces schema.sql
        item_row["status"] = "draft"
        item_res = supabase.table("heritage_items").insert(item_row).execute()

    if not item_res.data:
        raise HTTPException(status_code=500, detail="Failed to create heritage item record.")

    item_id = item_res.data[0]["id"]

    # 5. Create media row with public URL
    media_res = supabase.table("media").insert({
        "item_id": item_id,
        "url": public_url,
        "mime_type": mime_type,
        "caption": title,
        "is_illustrative": False
    }).execute()

    if not media_res.data:
        raise HTTPException(status_code=500, detail="Failed to create media record.")

    media_id = media_res.data[0]["id"]

    # 6. Initialize one processing_jobs row per stage with status 'pending'
    job_ids: Dict[str, str] = {}
    for stage_name in ["ocr", "translate", "tag", "finish"]:
        job_row = insert_processing_job(item_id, stage_name, "pending")
        if job_row and "id" in job_row:
            job_ids[stage_name] = job_row["id"]

    # 7. Start background task
    background_tasks.add_task(
        run_processing_pipeline,
        item_id=item_id,
        media_id=media_id,
        image_bytes=file_bytes,
        mime_type=mime_type,
        item_title=title,
        job_ids=job_ids
    )

    return {
        "id": item_id,
        "title": title,
        "status": "processing",
        "place_id": resolved_place_id,
        "media_url": public_url
    }


@app.get("/jobs/{item_id}")
def get_jobs(item_id: str):
    """
    GET /jobs/{item_id}: return the processing_jobs rows for the item.
    """
    res = supabase.table("processing_jobs").select("*").eq("item_id", item_id).order("created_at").execute()
    jobs = [normalize_job_row(j) for j in (res.data or [])]
    return jobs


@app.get("/items/{id}")
def get_item(id: str):
    """
    GET /items/{id}: return the item with its media, OCR lines and translations.
    """
    item_res = supabase.table("heritage_items").select("*").eq("id", id).execute()
    if not item_res.data:
        raise HTTPException(status_code=404, detail="Heritage item not found.")

    item = item_res.data[0]

    # Fetch media associated with item
    media_res = supabase.table("media").select("*").eq("item_id", id).execute()
    media_list = media_res.data or []

    all_ocr_lines: List[Dict[str, Any]] = []
    all_translations: List[Dict[str, Any]] = []

    # Attach OCR and Translations for each media record
    for m in media_list:
        ocr_res = supabase.table("ocr_texts").select("*").eq("media_id", m["id"]).execute()
        m["ocr_texts"] = ocr_res.data or []

        for ocr in m["ocr_texts"]:
            lines = ocr.get("lines", [])
            if isinstance(lines, list):
                all_ocr_lines.extend(lines)

            trans_res = supabase.table("translations").select("*").eq("ocr_id", ocr["id"]).execute()
            ocr["translations"] = trans_res.data or []
            all_translations.extend(trans_res.data or [])

    # Fetch tags
    try:
        tags_res = supabase.table("item_tags").select("tag_id, tags(name)").eq("item_id", id).execute()
        tags = [t["tags"]["name"] for t in (tags_res.data or []) if t.get("tags")]
    except Exception:
        tags = []

    item["media"] = media_list
    item["ocr_lines"] = all_ocr_lines
    item["translations"] = all_translations
    item["tags"] = tags

    return item


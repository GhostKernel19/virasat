import io
import os
import re
import sys
import time
import uuid
import logging
import traceback
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, List, Dict, Any

import httpx
from PIL import Image
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types
from supabase import create_client, Client

from json_parser import parse_json_from_response

# Ensure UTF-8 stdout on Windows
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

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

# Print whether environment variables are loaded (only true or false, never values)
print(f"GEMINI_API_KEY loaded: {bool(GEMINI_API_KEY)}")
print(f"SUPABASE_URL loaded: {bool(SUPABASE_URL)}")
print(f"SUPABASE_SERVICE_ROLE_KEY loaded: {bool(SUPABASE_SERVICE_ROLE_KEY)}")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    logger.warning("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in environment.")

# Initialize Supabase client with service role key
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


# -----------------------------------------------------------------------------
# FastAPI App Lifecycle & CORS Setup
# -----------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Print whether keys are loaded on app startup
    print(f"GEMINI_API_KEY loaded: {bool(GEMINI_API_KEY)}")
    print(f"SUPABASE_URL loaded: {bool(SUPABASE_URL)}")
    print(f"SUPABASE_SERVICE_ROLE_KEY loaded: {bool(SUPABASE_SERVICE_ROLE_KEY)}")
    yield


app = FastAPI(
    title="Virasat Heritage API",
    description="Backend API for Virasat Cultural Heritage Atlas",
    version="1.0.0",
    lifespan=lifespan
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


def update_processing_job(
    job_id: str,
    status: str,
    error: Optional[str] = None,
    started_at: Optional[str] = None,
    finished_at: Optional[str] = None
) -> None:
    """Update a processing job status, error, started_at, and finished_at timestamps."""
    update_data: Dict[str, Any] = {
        "status": status,
        "error": error
    }
    if started_at is not None:
        update_data["started_at"] = started_at
    if finished_at is not None:
        update_data["finished_at"] = finished_at

    try:
        supabase.table("processing_jobs").update(update_data).eq("id", job_id).execute()
        return
    except Exception as e:
        logger.debug(f"Direct job update ({status}) error: {e}")

    # Fallback to DB status enum
    fallback_status = STATUS_MAP_TO_DB.get(status, status)
    update_data["status"] = fallback_status
    supabase.table("processing_jobs").update(update_data).eq("id", job_id).execute()


# -----------------------------------------------------------------------------
# Image Processing Helper (Pillow)
# -----------------------------------------------------------------------------
def downscale_image(image_bytes: bytes, max_side: int = 1600, quality: int = 85) -> tuple[bytes, str]:
    """
    Downscale the image before sending to Gemini:
      - Max side (width or height) 1600px
      - JPEG quality 85
    Returns (downscaled_bytes, "image/jpeg").
    """
    try:
        with Image.open(io.BytesIO(image_bytes)) as img:
            if img.mode != "RGB":
                img = img.convert("RGB")
            width, height = img.size
            if max(width, height) > max_side:
                img.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)
            out_buf = io.BytesIO()
            img.save(out_buf, format="JPEG", quality=quality, optimize=True)
            return out_buf.getvalue(), "image/jpeg"
    except Exception as e:
        logger.warning(f"Image downscaling failed, falling back to original bytes: {e}")
        return image_bytes, "image/jpeg"


# -----------------------------------------------------------------------------
# Gemini Calling Helpers (using official google-genai SDK)
# -----------------------------------------------------------------------------
GEMINI_PREFERRED_MODELS = [
    "gemini-2.5-flash",
    "gemini-3.8-flash",
    "gemini-3.5-flash",
    "gemini-flash-latest"
]


def call_gemini_api(
    prompt: str,
    image_bytes: Optional[bytes] = None,
    mime_type: Optional[str] = None,
    thinking_budget: Optional[int] = None
) -> tuple[str, str]:
    """
    Call Gemini API using official google-genai client with:
      - 60 second timeout
      - Retry up to 3 times on 429/503 with 5s and 15s backoff, logging with timestamp
      - Optional thinking_budget (0 to disable thinking)
      - Automatic model fallback sequence starting with gemini-2.5-flash
    Returns (response_text, model_name).
    """
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not configured.")

    # Configure 60 second timeout (60,000 milliseconds)
    client = genai.Client(
        api_key=GEMINI_API_KEY,
        http_options=types.HttpOptions(timeout=60000)
    )

    contents: List[Any] = []
    if image_bytes and mime_type:
        part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
        contents.append(part)
    contents.append(prompt)

    config_kwargs: Dict[str, Any] = {}
    if thinking_budget is not None:
        config_kwargs["thinking_config"] = types.ThinkingConfig(thinking_budget=thinking_budget)

    gen_config = types.GenerateContentConfig(**config_kwargs) if config_kwargs else None

    retry_delays = [5, 15, 15]
    last_error: Optional[Exception] = None

    for model in GEMINI_PREFERRED_MODELS:
        # Retry up to 3 times on 429/503 for the model
        for attempt in range(1, 4):
            try:
                logger.info(f"Calling Gemini API with model: {model} (attempt {attempt}/3)")
                response = client.models.generate_content(
                    model=model,
                    contents=contents,
                    config=gen_config
                )
                if response and response.text:
                    return response.text, model
                elif response and response.candidates:
                    candidate = response.candidates[0]
                    if candidate.content and candidate.content.parts:
                        text = "".join(part.text or "" for part in candidate.content.parts)
                        return text, model
                raise ValueError(f"Empty text received from model {model}")

            except Exception as exc:
                last_error = exc
                err_str = str(exc)
                code = getattr(exc, "code", None)
                is_retryable = (code in (429, 503)) or any(
                    term in err_str.upper() for term in ["429", "503", "RESOURCE_EXHAUSTED", "UNAVAILABLE"]
                )

                if is_retryable and attempt < 3:
                    delay = retry_delays[attempt - 1]
                    now_iso = datetime.now(timezone.utc).isoformat()
                    retry_log = (
                        f"[{now_iso}] Gemini API returned status {code or '429/503'} "
                        f"on model {model}: {err_str[:200]}. Retrying in {delay}s (attempt {attempt}/3)..."
                    )
                    print(retry_log)
                    logger.warning(retry_log)
                    time.sleep(delay)
                    continue

                logger.warning(f"Gemini model {model} attempt {attempt} failed: {err_str[:250]}")
                break

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
      Stage 1: ocr (Gemini Devanagari line extraction with downscaled image, thinking_budget=0, compact JSON)
      Stage 2: translate (Gemini translation to English)
      Stage 3: tag (Keyword rules for tags & item_tags)
      Stage 4: finish (Update item status to 'needs_review')

    Wrapped in try/except to print full traceback, mark failed stage with error, and set item to 'failed'.
    Logs duration of each stage to terminal.
    """
    current_stage = "ocr"
    stage_start = time.perf_counter()
    try:
        logger.info(f"Starting processing pipeline for item_id={item_id}")

        # ---------------------------------------------------------------------
        # Stage 1: OCR
        # ---------------------------------------------------------------------
        current_stage = "ocr"
        stage_start = time.perf_counter()
        ocr_job_id = job_ids.get("ocr")
        started_at = datetime.now(timezone.utc).isoformat()
        if ocr_job_id:
            update_processing_job(ocr_job_id, status="running", started_at=started_at)

        # 1) Downscale image before sending to Gemini (max side 1600px, JPEG quality 85)
        ocr_image_bytes, ocr_mime_type = downscale_image(image_bytes, max_side=1600, quality=85)

        ocr_lines: List[Dict[str, Any]] = []
        ocr_id: Optional[str] = None
        original_text: str = ""

        # 3) Use gemini-2.5-flash with thinking_budget 0 for OCR and compact JSON only
        ocr_prompt = (
            "Transcribe all Devanagari text (Marathi / Sanskrit / Hindi) from this archival image. "
            "Return compact JSON only: [{\"text\":\"...\",\"confidence\":0.95}]. "
            "No explanation, no formatting outside the JSON array."
        )

        gemini_ocr_raw, used_ocr_model = call_gemini_api(
            prompt=ocr_prompt,
            image_bytes=ocr_image_bytes,
            mime_type=ocr_mime_type,
            thinking_budget=0
        )
        parsed_data = parse_json_from_response(gemini_ocr_raw)

        if isinstance(parsed_data, list):
            ocr_lines = parsed_data
        elif isinstance(parsed_data, dict):
            ocr_lines = parsed_data.get("lines", [parsed_data])
        else:
            raise ValueError(f"Unexpected JSON structure from OCR: {parsed_data}")

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

        finished_at = datetime.now(timezone.utc).isoformat()
        if ocr_job_id:
            update_processing_job(ocr_job_id, status="done", finished_at=finished_at)

        # 4) Log the duration of stage to the terminal
        stage_duration = time.perf_counter() - stage_start
        print(f"[{finished_at}] Stage 'ocr' completed in {stage_duration:.2f}s (model={used_ocr_model})")
        logger.info(f"Stage 'ocr' completed in {stage_duration:.2f}s (model={used_ocr_model})")

        # ---------------------------------------------------------------------
        # Stage 2: Translate
        # ---------------------------------------------------------------------
        current_stage = "translate"
        stage_start = time.perf_counter()
        translate_job_id = job_ids.get("translate")
        started_at = datetime.now(timezone.utc).isoformat()
        if translate_job_id:
            update_processing_job(translate_job_id, status="running", started_at=started_at)

        translate_prompt = (
            "Translate the following historical Devanagari / Marathi text lines into clear English. "
            "Maintain cultural and architectural context accurately.\n\n"
            f"Original Text:\n{original_text}\n\n"
            "Provide the English translation as plain text."
        )

        translated_text, used_trans_model = call_gemini_api(prompt=translate_prompt)
        translated_text = translated_text.strip()

        if ocr_id:
            supabase.table("translations").insert({
                "ocr_id": ocr_id,
                "language": "en",
                "text": translated_text,
                "model": used_trans_model,
                "is_illustrative": False
            }).execute()

        finished_at = datetime.now(timezone.utc).isoformat()
        if translate_job_id:
            update_processing_job(translate_job_id, status="done", finished_at=finished_at)

        # 4) Log the duration of stage to the terminal
        stage_duration = time.perf_counter() - stage_start
        print(f"[{finished_at}] Stage 'translate' completed in {stage_duration:.2f}s (model={used_trans_model})")
        logger.info(f"Stage 'translate' completed in {stage_duration:.2f}s (model={used_trans_model})")

        # ---------------------------------------------------------------------
        # Stage 3: Tag
        # ---------------------------------------------------------------------
        current_stage = "tag"
        stage_start = time.perf_counter()
        tag_job_id = job_ids.get("tag")
        started_at = datetime.now(timezone.utc).isoformat()
        if tag_job_id:
            update_processing_job(tag_job_id, status="running", started_at=started_at)

        combined_text = f"{item_title} {original_text} {translated_text}".lower()

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

        if not matched_tags:
            matched_tags.append("inscription")

        for tag_name in matched_tags:
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
                    pass

        finished_at = datetime.now(timezone.utc).isoformat()
        if tag_job_id:
            update_processing_job(tag_job_id, status="done", finished_at=finished_at)

        # 4) Log the duration of stage to the terminal
        stage_duration = time.perf_counter() - stage_start
        print(f"[{finished_at}] Stage 'tag' completed in {stage_duration:.2f}s (tags={matched_tags})")
        logger.info(f"Stage 'tag' completed in {stage_duration:.2f}s (tags={matched_tags})")

        # ---------------------------------------------------------------------
        # Stage 4: Finish
        # ---------------------------------------------------------------------
        current_stage = "finish"
        stage_start = time.perf_counter()
        finish_job_id = job_ids.get("finish")
        started_at = datetime.now(timezone.utc).isoformat()
        if finish_job_id:
            update_processing_job(finish_job_id, status="running", started_at=started_at)

        try:
            supabase.table("heritage_items").update({
                "status": "needs_review"
            }).eq("id", item_id).execute()
        except Exception:
            supabase.table("heritage_items").update({
                "status": "in_review"
            }).eq("id", item_id).execute()

        finished_at = datetime.now(timezone.utc).isoformat()
        if finish_job_id:
            update_processing_job(finish_job_id, status="done", finished_at=finished_at)

        # 4) Log the duration of stage to the terminal
        stage_duration = time.perf_counter() - stage_start
        print(f"[{finished_at}] Stage 'finish' completed in {stage_duration:.2f}s")
        logger.info(f"Stage 'finish' completed in {stage_duration:.2f}s")

    except Exception as exc:
        traceback.print_exc()
        stage_duration = time.perf_counter() - stage_start
        err_msg = str(exc)
        now_iso = datetime.now(timezone.utc).isoformat()
        print(f"[{now_iso}] Stage '{current_stage}' FAILED after {stage_duration:.2f}s: {err_msg}")
        logger.error(f"Pipeline failed at stage '{current_stage}' after {stage_duration:.2f}s: {err_msg}", exc_info=True)

        failed_job_id = job_ids.get(current_stage)
        finished_at = now_iso
        if failed_job_id:
            update_processing_job(
                failed_job_id,
                status="failed",
                error=err_msg,
                finished_at=finished_at
            )

        try:
            supabase.table("heritage_items").update({"status": "failed"}).eq("id", item_id).execute()
        except Exception as update_err:
            logger.debug(f"Direct update item status to failed error: {update_err}")
            try:
                supabase.table("heritage_items").update({"status": "draft"}).eq("id", item_id).execute()
            except Exception:
                pass


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
    place_id: str = Form(...)
):
    """
    POST /items (multipart: image file, title, place_id):
      - Requires a valid place_id (returns 400 if missing or invalid).
      - Uploads image to public Supabase Storage bucket 'uploads'.
      - Creates heritage_items row with status 'processing'.
      - Creates media row with public URL.
      - Starts FastAPI BackgroundTask for OCR, translation, tagging, and finish.
      - Returns the item id.
    """
    if not image.filename:
        raise HTTPException(status_code=400, detail="An image file is required.")

    if not title or not title.strip():
        raise HTTPException(status_code=400, detail="A title is required.")

    # 5) POST /items must require a valid place_id and return 400 otherwise (remove default Rani ki Vav id)
    if not place_id or not place_id.strip():
        raise HTTPException(status_code=400, detail="A valid place_id is required.")

    clean_place_id = place_id.strip()
    try:
        place_check = supabase.table("places").select("id").eq("id", clean_place_id).execute()
        if not place_check.data or len(place_check.data) == 0:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid place_id '{clean_place_id}': No matching place found in database."
            )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Error verifying place_id '{clean_place_id}': {exc}")
        raise HTTPException(status_code=400, detail=f"Invalid place_id '{clean_place_id}'.")

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

    # 3. Create heritage_items row with status 'processing'
    item_row = {
        "place_id": clean_place_id,
        "title": title.strip(),
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
        "title": title.strip(),
        "status": "processing",
        "place_id": clean_place_id,
        "media_url": public_url
    }


@app.post("/items/{id}/retry", status_code=200)
async def retry_item(
    id: str,
    background_tasks: BackgroundTasks
):
    """
    POST /items/{id}/retry:
      - Validates that the heritage item exists.
      - Retrieves its associated media asset and binary data.
      - Resets or re-creates the 4 processing_jobs rows with status 'pending' (clearing errors and timestamps).
      - Resets heritage_items status to 'processing' (or 'draft').
      - Re-runs the background processing pipeline.
      - Returns status and job details.
    """
    # 1. Fetch heritage item
    item_res = supabase.table("heritage_items").select("*").eq("id", id).execute()
    if not item_res.data:
        raise HTTPException(status_code=404, detail="Heritage item not found.")

    item = item_res.data[0]

    # 2. Fetch media record
    media_res = supabase.table("media").select("*").eq("item_id", id).order("created_at").limit(1).execute()
    if not media_res.data:
        raise HTTPException(status_code=404, detail="No media found for heritage item.")

    media = media_res.data[0]
    media_id = media["id"]
    media_url = media["url"]
    mime_type = media.get("mime_type") or "image/jpeg"

    # 3. Retrieve image bytes from URL or storage
    image_bytes: Optional[bytes] = None
    try:
        with httpx.Client(timeout=30.0) as http_client:
            resp = http_client.get(media_url)
            if resp.status_code == 200:
                image_bytes = resp.content
    except Exception as e:
        logger.warning(f"HTTP fetch of media_url failed: {e}")

    if not image_bytes:
        try:
            filename = media_url.split("/")[-1].split("?")[0]
            image_bytes = supabase.storage.from_("uploads").download(filename)
        except Exception as e:
            logger.error(f"Storage download failed: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to retrieve media file for retry: {str(e)}")

    # 4. Reset heritage item status to 'processing'
    try:
        supabase.table("heritage_items").update({"status": "processing"}).eq("id", id).execute()
    except Exception:
        supabase.table("heritage_items").update({"status": "draft"}).eq("id", id).execute()

    # 5. Initialize or reset processing_jobs rows to 'pending'
    job_ids: Dict[str, str] = {}
    for stage_name in ["ocr", "translate", "tag", "finish"]:
        db_stage = STAGE_MAP_TO_DB.get(stage_name, stage_name)
        existing = (
            supabase.table("processing_jobs")
            .select("id")
            .eq("item_id", id)
            .in_("stage", [stage_name, db_stage])
            .execute()
        )

        if existing.data:
            job_id = existing.data[0]["id"]
            # Reset existing job to pending, clearing error and timestamps
            try:
                supabase.table("processing_jobs").update({
                    "status": "pending",
                    "error": None,
                    "started_at": None,
                    "finished_at": None
                }).eq("id", job_id).execute()
            except Exception:
                pass
            job_ids[stage_name] = job_id
        else:
            new_job = insert_processing_job(id, stage_name, "pending")
            if new_job and "id" in new_job:
                job_ids[stage_name] = new_job["id"]

    # 6. Spawn background pipeline
    background_tasks.add_task(
        run_processing_pipeline,
        item_id=id,
        media_id=media_id,
        image_bytes=image_bytes,
        mime_type=mime_type,
        item_title=item.get("title", ""),
        job_ids=job_ids
    )

    return {
        "id": id,
        "status": "processing",
        "message": "Retry background pipeline started successfully.",
        "job_ids": job_ids
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

    # Check if any processing job failed; if so, reflect status 'failed'
    jobs_res = supabase.table("processing_jobs").select("status").eq("item_id", id).execute()
    if jobs_res.data:
        job_statuses = [j.get("status") for j in jobs_res.data]
        if "failed" in job_statuses:
            item["status"] = "failed"

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


@app.get("/search")
def search(
    q: Optional[str] = None,
    type: Optional[str] = None,
    state: Optional[str] = None
):
    """
    GET /search?q=&type=&state=
    Searches case-insensitively (ilike) across:
      - places.name, places.summary, places.state
      - ocr_texts.original_text
      - translations.text
    Returns:
      {
        "places": [{id, name, state, period, type, summary}],
        "passages": [{ocr_id, place_id, place_name, item_title, original_text, translation_text, matched_field}]
      }
    Returns an empty result for an empty q, and limits each group to 20.
    """
    if not q or not q.strip():
        return {"places": [], "passages": []}

    query_str = q.strip()
    safe_q = query_str.replace(",", " ").replace("%", "").strip()
    if not safe_q:
        return {"places": [], "passages": []}

    type_filter = type.strip() if type and type.strip() else None
    state_filter = state.strip() if state and state.strip() else None

    # Helper retry runner for Supabase queries
    def run_query(builder, retries=3):
        for attempt in range(retries):
            try:
                return builder.execute()
            except Exception as e:
                if attempt == retries - 1:
                    logger.warning(f"Search query error: {e}")
                    return None
                time.sleep(0.3 * (attempt + 1))
        return None

    # 1. Search places across name, summary, state
    places_builder = (
        supabase.table("places")
        .select("id, name, state, period, type, summary")
        .or_(f"name.ilike.%{safe_q}%,summary.ilike.%{safe_q}%,state.ilike.%{safe_q}%")
    )
    if type_filter:
        places_builder = places_builder.ilike("type", f"%{type_filter}%")
    if state_filter:
        places_builder = places_builder.ilike("state", f"%{state_filter}%")

    places_res = run_query(places_builder.limit(20))
    places_rows = places_res.data if places_res and places_res.data else []

    formatted_places = [
        {
            "id": str(p.get("id")),
            "name": p.get("name") or "",
            "state": p.get("state") or "",
            "period": p.get("period") or "",
            "type": p.get("type") or "",
            "summary": p.get("summary") or ""
        }
        for p in places_rows[:20]
    ]

    # 2. Search passages (ocr_texts and translations)
    passages_dict: Dict[str, Dict[str, Any]] = {}

    # 2a. Search ocr_texts.original_text
    ocr_builder = (
        supabase.table("ocr_texts")
        .select("id, original_text, media(heritage_items(id, title, places(id, name, type, state))), translations(id, text)")
        .ilike("original_text", f"%{safe_q}%")
    )
    ocr_res = run_query(ocr_builder.limit(40))
    if ocr_res and ocr_res.data:
        for row in ocr_res.data:
            ocr_id = str(row.get("id") or "")
            if not ocr_id:
                continue

            media = row.get("media") or {}
            item = media.get("heritage_items") or {}
            place = item.get("places") or {}

            p_type = place.get("type") or ""
            p_state = place.get("state") or ""

            if type_filter and type_filter.lower() not in p_type.lower():
                continue
            if state_filter and state_filter.lower() not in p_state.lower():
                continue

            translations = row.get("translations") or []
            trans_text = translations[0].get("text", "") if translations else ""

            passages_dict[ocr_id] = {
                "ocr_id": ocr_id,
                "place_id": str(place.get("id") or ""),
                "place_name": place.get("name") or "",
                "item_title": item.get("title") or "",
                "original_text": row.get("original_text") or "",
                "translation_text": trans_text,
                "matched_field": "original_text"
            }

    # 2b. Search translations.text
    trans_builder = (
        supabase.table("translations")
        .select("id, text, ocr_id, ocr_texts(id, original_text, media(heritage_items(id, title, places(id, name, type, state)))))")
        .ilike("text", f"%{safe_q}%")
    )
    trans_res = run_query(trans_builder.limit(40))
    if trans_res and trans_res.data:
        for row in trans_res.data:
            ocr = row.get("ocr_texts") or {}
            ocr_id = str(row.get("ocr_id") or ocr.get("id") or "")
            if not ocr_id:
                continue

            media = ocr.get("media") or {}
            item = media.get("heritage_items") or {}
            place = item.get("places") or {}

            p_type = place.get("type") or ""
            p_state = place.get("state") or ""

            if type_filter and type_filter.lower() not in p_type.lower():
                continue
            if state_filter and state_filter.lower() not in p_state.lower():
                continue

            if ocr_id in passages_dict:
                if not passages_dict[ocr_id]["translation_text"]:
                    passages_dict[ocr_id]["translation_text"] = row.get("text") or ""
            else:
                passages_dict[ocr_id] = {
                    "ocr_id": ocr_id,
                    "place_id": str(place.get("id") or ""),
                    "place_name": place.get("name") or "",
                    "item_title": item.get("title") or "",
                    "original_text": ocr.get("original_text") or "",
                    "translation_text": row.get("text") or "",
                    "matched_field": "translation_text"
                }

    formatted_passages = list(passages_dict.values())[:20]

    return {
        "places": formatted_places,
        "passages": formatted_passages
    }


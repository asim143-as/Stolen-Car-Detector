# Must be set before numpy/torch/opencv are imported below -- on Windows,
# PyTorch and NumPy/OpenCV each bundle their own OpenMP runtime
# (libiomp5md.dll), which crashes the process on startup with "OMP:
# Error #15" unless this is set. Baked in here so it's never forgotten
# in a fresh terminal session.
import os
os.environ.setdefault("KMP_DUPLICATE_LIB_OK", "TRUE")

import re
import difflib
import cv2
import numpy as np
import shutil
import uuid
import threading
import queue
import time
import asyncio
import base64
from contextlib import contextmanager
from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, WebSocket, WebSocketDisconnect, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel

import jwt
from jwt import PyJWKClient

from ultralytics import YOLO
import easyocr

import psycopg2
from psycopg2 import pool as pg_pool
from dotenv import load_dotenv

import torch
_orig_torch_load = torch.load
def _patched_load(*args, **kwargs):
    kwargs["weights_only"] = False
    return _orig_torch_load(*args, **kwargs)
torch.load = _patched_load

load_dotenv()

# ------------------------------------------------------------------
# Paths / constants
# ------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CAR_MODEL_PATH = os.path.join(BASE_DIR, "yolov8n.pt")
PLATE_MODEL_PATH = os.path.join(BASE_DIR, "stolen_car_detector", "models", "yolov8_plates.pt")
DETECTIONS_DIR = os.path.join(BASE_DIR, "detections")
OUTPUTS_DIR = os.path.join(BASE_DIR, "outputs")
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")

os.makedirs(DETECTIONS_DIR, exist_ok=True)
os.makedirs(OUTPUTS_DIR, exist_ok=True)
os.makedirs(UPLOADS_DIR, exist_ok=True)

VEHICLE_IDS = {2, 3, 5, 7}

# Night-detection: frames darker than this (0-255 mean) get CLAHE + gamma
# enhancement before being handed to YOLO/OCR. Well-lit frames skip this
# entirely so daytime speed/quality is untouched.
LOW_LIGHT_THRESHOLD = 95

# Confidence thresholds are lower at night: YOLO's boxes are naturally less
# confident on darker/noisier frames, so using the same daytime threshold
# was causing real cars/plates to get filtered out and never even reach
# the OCR step.
DAY_CAR_CONF = 0.20
NIGHT_CAR_CONF = 0.20
DAY_PLATE_CONF = 0.20
NIGHT_PLATE_CONF = 0.18

# Speed: a matched car keeps its last OCR'd plate text for this many
# *processed* frames instead of re-running OCR every time.
RECHECK_EVERY = 8
IOU_MATCH_THRESHOLD = 0.30

# ------------------------------------------------------------------
# Database (Postgres / Supabase) via a small connection pool
# ------------------------------------------------------------------
DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is not set. Copy .env.example to .env and paste your "
        "Supabase connection string into it."
    )

db_pool = pg_pool.SimpleConnectionPool(1, 10, dsn=DATABASE_URL)


@contextmanager
def get_conn():
    conn = db_pool.getconn()
    try:
        yield conn
    finally:
        db_pool.putconn(conn)


# ------------------------------------------------------------------
# Gemini AI assistant (general purpose chatbot)
# ------------------------------------------------------------------
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.7-flash")

gemini_client = None
if GEMINI_API_KEY:
    try:
        from google import genai as google_genai
        gemini_client = google_genai.Client(api_key=GEMINI_API_KEY)
        print(f"Gemini assistant ready (model={GEMINI_MODEL}).")
    except Exception as e:
        print(f"WARNING: could not initialize Gemini client: {e}")
else:
    print("WARNING: GEMINI_API_KEY not set. /api/chat will return 503 until it is.")


# ------------------------------------------------------------------
# In-memory registry for live video-detection jobs.
# A video is uploaded once via /api/detect/video/start, which hands
# back a job_id; the frontend then opens /ws/detect/{job_id} to
# receive annotated frames live, as they're processed, instead of
# waiting for the whole video to finish.
# ------------------------------------------------------------------
PENDING_VIDEO_JOBS = {}

# ------------------------------------------------------------------
# Auth: verifying Supabase Auth tokens + role-based access
#
# Login itself (Google or email/password) happens entirely on the
# Next.js frontend via Supabase Auth -- this backend never sees a
# password. Every request the frontend makes to a protected endpoint
# just carries the Supabase access token in an Authorization: Bearer
# header; this backend verifies that token locally (no round trip to
# Supabase needed) and looks up the caller's role.
#
# There are 3 roles, matching the User / Administration / Admin
# portals: "user" (submits stolen-car reports, views their own
# status), "administration" (runs live video detection, reviews
# matches, marks a report Found/Not Found), "admin" (everything,
# plus managing who has which role).
# ------------------------------------------------------------------
SUPABASE_URL = os.environ.get("SUPABASE_URL")  # e.g. https://xxxx.supabase.co
SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET")  # legacy HS256 fallback, optional

_jwks_client = None
if SUPABASE_URL:
    try:
        _jwks_client = PyJWKClient(f"{SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json")
    except Exception as e:
        print(f"WARNING: could not set up Supabase JWKS client: {e}")
else:
    print("WARNING: SUPABASE_URL not set. All authenticated endpoints will return 401.")


def _decode_supabase_jwt(token: str) -> dict:
    """Verifies a Supabase Auth access token and returns its claims.
    Projects created after Oct 2025 sign tokens asymmetrically
    (ES256/RS256) with keys published at the project's JWKS endpoint --
    verified locally here, no call back to Supabase. Older projects
    still on the legacy shared secret (HS256) work too via the
    SUPABASE_JWT_SECRET fallback below."""
    last_error = None

    if _jwks_client is not None:
        try:
            signing_key = _jwks_client.get_signing_key_from_jwt(token)
            return jwt.decode(
                token, signing_key.key, algorithms=["ES256", "RS256"], audience="authenticated"
            )
        except Exception as e:
            last_error = e

    if SUPABASE_JWT_SECRET:
        try:
            return jwt.decode(
                token, SUPABASE_JWT_SECRET, algorithms=["HS256"], audience="authenticated"
            )
        except Exception as e:
            last_error = e

    raise HTTPException(status_code=401, detail=f"Invalid or expired token: {last_error}")


def get_or_create_profile(user_id: str, email: Optional[str]) -> str:
    """Looks up this user's role; if this is their first authenticated
    request, creates a 'profiles' row for them with the default role
    'user'. An admin can promote someone to 'administration' or 'admin'
    later via /api/admin/users (or directly in the Supabase table
    editor)."""
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT role FROM profiles WHERE id = %s", (user_id,))
            row = cur.fetchone()
            if row:
                return row[0]
            cur.execute(
                """INSERT INTO profiles (id, email, role) VALUES (%s, %s, 'user')
                   ON CONFLICT (id) DO NOTHING RETURNING role""",
                (user_id, email),
            )
            inserted = cur.fetchone()
        conn.commit()
        if inserted:
            return inserted[0]
        # Lost a race with a concurrent request creating the same row -- just re-read it.
        with conn.cursor() as cur:
            cur.execute("SELECT role FROM profiles WHERE id = %s", (user_id,))
            row = cur.fetchone()
    return row[0] if row else "user"


def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization.split(" ", 1)[1]
    claims = _decode_supabase_jwt(token)
    user_id = claims.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token missing subject claim")
    role = get_or_create_profile(user_id, claims.get("email"))
    return {"id": user_id, "email": claims.get("email"), "role": role}


def require_role(*allowed_roles):
    """Dependency factory: require_role("administration", "admin") only
    lets those two roles through; require_role() with no args just means
    'must be logged in, any role'."""
    def _dep(user: dict = Depends(get_current_user)):
        if allowed_roles and user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"This action requires one of these roles: {', '.join(allowed_roles)}",
            )
        return user
    return _dep


app = FastAPI(title="Stolen Car Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/files/detections", StaticFiles(directory=DETECTIONS_DIR), name="detections")
app.mount("/files/outputs", StaticFiles(directory=OUTPUTS_DIR), name="outputs")


# Database helpers

def init_db():
    with get_conn() as conn:
        with conn.cursor() as cur:
            # One row per authenticated user; created lazily on first
            # request (see get_or_create_profile) with role='user'.
            # Promote someone to 'administration' or 'admin' via
            # /api/admin/users/{id}/role once you're an admin yourself.
            cur.execute("""
                CREATE TABLE IF NOT EXISTS profiles (
                    id          UUID PRIMARY KEY,
                    email       TEXT,
                    role        TEXT NOT NULL DEFAULT 'user',
                    created_at  TIMESTAMPTZ DEFAULT now()
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS stolen_cars (
                    id              SERIAL PRIMARY KEY,
                    plate_number    TEXT UNIQUE NOT NULL,
                    owner_name      TEXT,
                    car_model       TEXT,
                    car_color       TEXT,
                    date_added      TEXT
                )
            """)
            # Migration safety net: adds the report-workflow columns even
            # if this table already existed from before the role system.
            cur.execute("ALTER TABLE stolen_cars ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id)")
            cur.execute("ALTER TABLE stolen_cars ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'")
            cur.execute("ALTER TABLE stolen_cars ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES profiles(id)")
            cur.execute("ALTER TABLE stolen_cars ADD COLUMN IF NOT EXISTS reviewed_at TEXT")
            cur.execute("ALTER TABLE stolen_cars ADD COLUMN IF NOT EXISTS review_notes TEXT")
            cur.execute("""
                CREATE TABLE IF NOT EXISTS detections (
                    id              SERIAL PRIMARY KEY,
                    plate_number    TEXT,
                    owner_name      TEXT,
                    car_model       TEXT,
                    car_color       TEXT,
                    frame           INTEGER,
                    video_time      REAL,
                    image_filename  TEXT,
                    source_video    TEXT,
                    detected_at     TEXT
                )
            """)
        conn.commit()


def register_car(plate, name, model, color, user_id):
    plate = plate.upper().strip()
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO stolen_cars (plate_number, owner_name, car_model, car_color, date_added, user_id, status)
                   VALUES (%s, %s, %s, %s, %s, %s, 'pending')
                   ON CONFLICT (plate_number) DO NOTHING
                   RETURNING id""",
                (plate, name, model, color, datetime.now().isoformat(), user_id),
            )
            row = cur.fetchone()
        conn.commit()
    return row[0] if row else None


def _row_to_report(r):
    return {
        "id": r[0], "plate": r[1].upper().strip(), "owner": r[2], "model": r[3], "color": r[4],
        "date_added": r[5], "user_id": str(r[6]) if r[6] else None, "status": r[7],
        "reviewed_by": str(r[8]) if r[8] else None, "reviewed_at": r[9], "review_notes": r[10],
    }


REPORT_COLUMNS = "id, plate_number, owner_name, car_model, car_color, date_added, user_id, status, reviewed_by, reviewed_at, review_notes"


def get_all_cars(status_filter: Optional[str] = None):
    with get_conn() as conn:
        with conn.cursor() as cur:
            if status_filter:
                cur.execute(f"SELECT {REPORT_COLUMNS} FROM stolen_cars WHERE status = %s ORDER BY id DESC", (status_filter,))
            else:
                cur.execute(f"SELECT {REPORT_COLUMNS} FROM stolen_cars ORDER BY id DESC")
            rows = cur.fetchall()
    return [_row_to_report(r) for r in rows]


def get_cars_for_user(user_id):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(f"SELECT {REPORT_COLUMNS} FROM stolen_cars WHERE user_id = %s ORDER BY id DESC", (user_id,))
            rows = cur.fetchall()
    return [_row_to_report(r) for r in rows]


def update_report_status(report_id, status, reviewer_id, notes=None):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """UPDATE stolen_cars SET status=%s, reviewed_by=%s, reviewed_at=%s, review_notes=%s
                   WHERE id=%s""",
                (status, reviewer_id, datetime.now().isoformat(), notes, report_id),
            )
            updated = cur.rowcount > 0
        conn.commit()
    return updated


def delete_car(report_id):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM stolen_cars WHERE id = %s", (report_id,))
            deleted = cur.rowcount > 0
        conn.commit()
    return deleted


def list_profiles():
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id, email, role, created_at FROM profiles ORDER BY created_at DESC")
            rows = cur.fetchall()
    return [{"id": str(r[0]), "email": r[1], "role": r[2], "created_at": str(r[3])} for r in rows]


def set_profile_role(user_id, role):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("UPDATE profiles SET role = %s WHERE id = %s", (role, user_id))
            updated = cur.rowcount > 0
        conn.commit()
    return updated


OCR_NORM_MAP = str.maketrans({
    "8": "B", "6": "G", "5": "S", "0": "O", "1": "I", "Z": "2",
    "C": "S", "U": "O", "V": "O", "D": "O", "4": "A"
})

def normalize_plate_for_match(text):
    clean = re.sub(r"[^A-Z0-9]", "", text.upper())
    return clean.translate(OCR_NORM_MAP)

def find_car_in_db(plate_text):
    if not plate_text or len(plate_text.strip()) < 3:
        return None
    clean = re.sub(r"[^A-Z0-9]", "", plate_text.upper())
    if not clean:
        return None

    cars = get_all_cars()
    # 1. Exact match
    for car in cars:
        car_clean = re.sub(r"[^A-Z0-9]", "", car["plate"].upper())
        if clean == car_clean:
            return car

    # 2. Substring match (e.g. "GB BG65USJ" -> "BG65USJ", or "BG65US" in "BG65USJ")
    for car in cars:
        car_clean = re.sub(r"[^A-Z0-9]", "", car["plate"].upper())
        if len(clean) >= 4 and len(car_clean) >= 4:
            if car_clean in clean or clean in car_clean:
                return car

    # 3. Normalized OCR similarity (handles B<->8, S<->5, O<->0, I<->1, C<->S, 6<->G, U<->O)
    norm_clean = normalize_plate_for_match(clean)
    best_match = None
    best_ratio = 0.0

    for car in cars:
        car_clean = re.sub(r"[^A-Z0-9]", "", car["plate"].upper())
        norm_car = normalize_plate_for_match(car_clean)

        # Direct normalized match
        if norm_clean == norm_car:
            return car

        # Similarity ratio
        ratio = difflib.SequenceMatcher(None, norm_clean, norm_car).ratio()
        if ratio > best_ratio:
            best_ratio = ratio
            best_match = car

    # If 70%+ similar
    if best_ratio >= 0.70 and best_match is not None:
        return best_match

    return None


def save_detection(db_car, frame_idx, video_time, image_filename, source_video):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO detections
                   (plate_number, owner_name, car_model, car_color, frame, video_time,
                    image_filename, source_video, detected_at)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                (db_car["plate"], db_car["owner"], db_car["model"], db_car["color"],
                 frame_idx, video_time, image_filename, source_video, datetime.now().isoformat()),
            )
        conn.commit()


def get_all_detections():
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("""SELECT id, plate_number, owner_name, car_model, car_color,
                                  frame, video_time, image_filename, source_video, detected_at
                           FROM detections ORDER BY id DESC""")
            rows = cur.fetchall()
    out = []
    for r in rows:
        out.append({
            "id": r[0],
            "plate": r[1],
            "owner": r[2],
            "model": r[3],
            "color": r[4],
            "frame": r[5],
            "time": r[6],
            "image_url": f"/files/detections/{r[7]}" if r[7] else None,
            "source_video": r[8],
            "detected_at": r[9],
        })
    return out


init_db()

# Model loading (once, at startup)

car_model = None
plate_model = None
ocr = None


@app.on_event("startup")
def load_models():
    global car_model, plate_model, ocr
    print("Loading models...")
    car_model = YOLO(CAR_MODEL_PATH)

    if os.path.exists(PLATE_MODEL_PATH):
        plate_model = YOLO(PLATE_MODEL_PATH)
    else:
        plate_model = None
        print(f"WARNING: plate model not found at {PLATE_MODEL_PATH}. "
              f"Plate detection/OCR will be skipped until you add it there.")

    ocr = easyocr.Reader(["en"], gpu=False, verbose=False)
    print("Models ready.")


# ------------------------------------------------------------------
# Night / low-light enhancement
# ------------------------------------------------------------------

def enhance_low_light(frame):
    """Improves visibility on dark/night frames before detection runs, so
    the same (untrained-on-night-data) model has a better chance of picking
    up cars and plates after dark. Well-lit frames are returned untouched
    so daytime accuracy and speed are unaffected.

    Returns (frame, was_enhanced) -- was_enhanced tells the caller whether
    this is a "night" frame, so detection confidence thresholds can be
    loosened to match (see NIGHT_CAR_CONF / NIGHT_PLATE_CONF).
    """
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    brightness = float(gray.mean())
    if brightness > LOW_LIGHT_THRESHOLD:
        return frame, False

    lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)

    # Local contrast boost. Tile-based (not a single global curve) so it
    # copes with patchy night lighting -- e.g. a bright pool from a
    # streetlamp right next to a pitch-black stretch of road.
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    l = clahe.apply(l)

    # Auto gamma: instead of one manually-picked "very dark" cutoff, aim
    # this frame's midtones at a fixed target brightness. Scales smoothly
    # with however dark the frame actually is, rather than jumping between
    # two fixed presets.
    mean_l = max(l.mean() / 255.0, 1e-3)
    target = 0.45
    gamma = float(np.clip(np.log(mean_l) / np.log(target), 0.35, 2.2))
    table = ((np.arange(256) / 255.0) ** (1.0 / gamma) * 255).astype("uint8")
    l = cv2.LUT(l, table)

    # Roll off the brightest pixels instead of leaving them to blow out
    # further. This is what actually helps dashcam footage: without it,
    # oncoming headlights (and the plate lit up inside that glare) turn
    # into a flat white blob after the gamma boost above.
    hi_mask = l > 235
    if np.any(hi_mask):
        l[hi_mask] = (235 + (l[hi_mask].astype(np.int16) - 235) * 0.3).astype("uint8")

    enhanced = cv2.merge((l, a, b))
    bgr = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)

    # CLAHE + gamma amplify sensor noise right along with the real signal.
    # A light edge-preserving denoise here keeps that noise from confusing
    # YOLO's box confidence or OCR downstream.
    bgr = cv2.bilateralFilter(bgr, d=5, sigmaColor=40, sigmaSpace=40)

    return bgr, True


# Detection logic (ported from the notebook)

def detect_cars(frame, low_light=False):
    conf = NIGHT_CAR_CONF if low_light else DAY_CAR_CONF
    res = car_model(frame, imgsz=640, conf=conf, verbose=False)[0]
    cars = []
    h, w = frame.shape[:2]
    for box in res.boxes:
        if int(box.cls[0]) not in VEHICLE_IDS:
            continue
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(w, x2), min(h, y2)
        box_w, box_h = (x2 - x1), (y2 - y1)
        if box_w < 25 or box_h < 20:
            continue
        aspect = box_w / box_h
        if aspect < 0.4 or aspect > 4.0:
            continue
        cars.append((x1, y1, x2, y2))
    return cars


def detect_plates_full(frame, low_light=False):
    """Runs high-accuracy plate detection over the entire frame in a single fast YOLO pass (~20ms)."""
    if plate_model is None:
        return []
    conf = NIGHT_PLATE_CONF if low_light else DAY_PLATE_CONF
    res = plate_model(frame, imgsz=640, conf=conf, verbose=False)[0]
    plates = []
    h, w = frame.shape[:2]
    for box in res.boxes:
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(w, x2), min(h, y2)
        conf_score = float(box.conf[0])
        plates.append((x1, y1, x2, y2, conf_score))
    return plates


def detect_plate(frame, car_box, low_light=False):
    if plate_model is None:
        return None, None
    cx1, cy1, cx2, cy2 = car_box
    ch = cy2 - cy1
    cw = cx2 - cx1
    if ch < 15 or cw < 20:
        return None, None

    start_y = cy1 + int(ch * 0.2)
    region = frame[start_y:cy2, cx1:cx2]
    if region.size == 0:
        region = frame[cy1:cy2, cx1:cx2]
        start_y = cy1

    conf = NIGHT_PLATE_CONF if low_light else DAY_PLATE_CONF
    res = plate_model(region, imgsz=320, conf=conf, verbose=False)[0]
    
    if not res.boxes and start_y != cy1:
        full_region = frame[cy1:cy2, cx1:cx2]
        if full_region.size > 0:
            res = plate_model(full_region, imgsz=320, conf=conf, verbose=False)[0]
            start_y = cy1

    if not res.boxes:
        return None, None

    best = max(res.boxes, key=lambda b: float(b.conf[0]))
    rx1, ry1, rx2, ry2 = map(int, best.xyxy[0])
    box = (cx1 + rx1, start_y + ry1, cx1 + rx2, start_y + ry2)
    crop = frame[box[1]:box[3], box[0]:box[2]]
    return box, crop


def read_plate(crop, low_light=False):
    """Runs OCR on a plate crop with multi-stage preprocessing: Otsu binarization, CLAHE, and inverted thresholding."""
    if crop is None or crop.size == 0 or ocr is None:
        return ""
    h, w = crop.shape[:2]
    if h < 14 or w < 20:
        return ""

    scale = max(80.0 / h, 240.0 / w, 2.5)
    resized = cv2.resize(crop, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_CUBIC)
    gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)

    # 1. Otsu thresholding (best for clean daylight and white plates)
    _, otsu = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    results = ocr.readtext(otsu, allowlist="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-", detail=1)
    texts = [(t, c) for _, t, c in results if c > 0.15 and len(t.strip()) >= 2]

    # 2. CLAHE local contrast enhancement
    if not texts:
        denoised = cv2.bilateralFilter(gray, 9, 75, 75)
        clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(6, 6)).apply(denoised)
        results = ocr.readtext(clahe, allowlist="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-", detail=1)
        texts = [(t, c) for _, t, c in results if c > 0.15 and len(t.strip()) >= 2]

    # 3. Inverted thresholding (for dark plates or yellow rear plates)
    if not texts:
        results = ocr.readtext(255 - otsu, allowlist="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-", detail=1)
        texts = [(t, c) for _, t, c in results if c > 0.15 and len(t.strip()) >= 2]

    # 4. Fallback on raw resized
    if not texts:
        results = ocr.readtext(resized, allowlist="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-", detail=1)
        texts = [(t, c) for _, t, c in results if c > 0.12 and len(t.strip()) >= 2]

    if not texts:
        return ""

    raw_joined = " ".join(t.strip() for t, _ in texts)
    best_text = re.sub(r"[^A-Z0-9]", "", raw_joined.upper())
    return best_text.strip()


def _iou(a, b):
    xA, yA = max(a[0], b[0]), max(a[1], b[1])
    xB, yB = min(a[2], b[2]), min(a[3], b[3])
    inter = max(0, xB - xA) * max(0, yB - yA)
    areaA = (a[2] - a[0]) * (a[3] - a[1])
    areaB = (b[2] - b[0]) * (b[3] - b[1])
    denom = areaA + areaB - inter
    return inter / denom if denom > 0 else 0.0


def analyze_frame(frame, tracks, frame_idx, max_ocr_calls=6):
    """Core detection+tracking logic for one frame: finds cars, keeps
    track continuity across frames (via IOU), OCRs plates (throttled by
    RECHECK_EVERY *and* by max_ocr_calls), and checks each against the
    stolen-car database. Returns box data only -- no drawing -- so it
    can be reused by both the legacy full-frame annotator below and the
    live-streaming detection worker, which needs coordinates, not a
    picture.

    max_ocr_calls caps how many plate-OCR calls (the slow step -- YOLO
    plate detection + EasyOCR) happen in a single call. Car *detection*
    itself is one fast YOLO pass regardless of how many cars are in
    frame, but a busy highway shot can easily have 30+ cars, and OCR-ing
    all of them before returning would make the live view stall/lag
    badly behind the video. Cars beyond the budget still get a box
    (just no plate label yet) and get their turn on a later cycle.
    """
    detect_frame, low_light = enhance_low_light(frame)
    cars = detect_cars(detect_frame, low_light)
    used_ids = set()
    results = []
    ocr_calls = 0

    for car_box in cars:
        best_track, best_score = None, 0.0
        for t in tracks:
            if t["id"] in used_ids:
                continue
            score = _iou(car_box, t["box"])
            if score > best_score:
                best_score, best_track = score, t

        if best_track is not None and best_score >= IOU_MATCH_THRESHOLD:
            best_track["box"] = car_box
            best_track["last_seen"] = frame_idx
            used_ids.add(best_track["id"])
            stale = (frame_idx - best_track["checked_at"]) >= RECHECK_EVERY
            if (stale or not best_track["plate_text"]) and ocr_calls < max_ocr_calls:
                _, plate_crop = detect_plate(detect_frame, car_box, low_light)
                new_text = read_plate(plate_crop, low_light)
                best_track["plate_text"] = new_text or best_track["plate_text"]
                best_track["checked_at"] = frame_idx
                ocr_calls += 1
            plate_text = best_track["plate_text"]
        else:
            if ocr_calls < max_ocr_calls:
                _, plate_crop = detect_plate(detect_frame, car_box, low_light)
                plate_text = read_plate(plate_crop, low_light)
                ocr_calls += 1
            else:
                plate_text = ""  # will be OCR'd on a later cycle once this track exists
            best_track = {
                "id": uuid.uuid4().hex[:8],
                "box": car_box,
                "plate_text": plate_text,
                "checked_at": frame_idx,
                "last_seen": frame_idx,
            }
            tracks.append(best_track)
            used_ids.add(best_track["id"])

        db_car = find_car_in_db(plate_text)
        results.append({"box": car_box, "plate_text": plate_text, "matched_car": db_car})

    tracks[:] = [t for t in tracks if frame_idx - t["last_seen"] <= RECHECK_EVERY * 3]
    return results


def annotate_and_check(frame, tracks, frame_idx):
    """Legacy: draws boxes onto a copy of the frame, used only by the
    one-shot /api/detect/video endpoint. The live WebSocket pipeline
    uses analyze_frame() directly and draws on the frontend instead."""
    display_frame = frame.copy()
    results = analyze_frame(frame, tracks, frame_idx)
    matches = []

    for r in results:
        x1, y1, x2, y2 = r["box"]
        db_car = r["matched_car"]
        plate_text = r["plate_text"]

        if db_car:
            color = (0, 0, 255)
            label = f"STOLEN: {db_car['plate']}"
            matches.append(db_car)
        elif plate_text:
            color = (255, 150, 0)
            label = plate_text
        else:
            color = (0, 200, 255)
            label = "No Plate"

        cv2.rectangle(display_frame, (x1, y1), (x2, y2), color, 3)
        if label:
            (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.8, 2)
            cv2.rectangle(display_frame, (x1, y1 - th - 12), (x1 + tw + 8, y1), color, -1)
            cv2.putText(display_frame, label, (x1 + 4, y1 - 4),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

    return display_frame, matches



# API: stolen-car reports (User submits, Administration reviews, Admin manages all)

class ReportCreate(BaseModel):
    plate: str
    owner: str
    model: str
    color: str


class StatusUpdate(BaseModel):
    status: str  # 'pending' | 'under_review' | 'found' | 'not_found'
    notes: Optional[str] = None


VALID_STATUSES = {"pending", "under_review", "found", "not_found"}


@app.post("/api/reports")
def api_create_report(payload: ReportCreate, user: dict = Depends(require_role("user"))):
    """A User submits their own stolen car. Starts life as 'pending' --
    Administration will update the status after reviewing footage."""
    report_id = register_car(payload.plate, payload.owner, payload.model, payload.color, user["id"])
    if report_id is None:
        raise HTTPException(status_code=409, detail=f"Plate {payload.plate.upper()} is already reported")
    return {"success": True, "report_id": report_id, "status": "pending"}


@app.get("/api/reports/me")
def api_my_reports(user: dict = Depends(require_role("user"))):
    """A User views only their own reports and their current status."""
    return {"reports": get_cars_for_user(user["id"])}


@app.get("/api/reports")
def api_all_reports(status: Optional[str] = None, user: dict = Depends(require_role("administration", "admin"))):
    """Administration/Admin see every report, optionally filtered by status
    (e.g. ?status=pending to see what still needs reviewing)."""
    if status and status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"status must be one of {sorted(VALID_STATUSES)}")
    return {"reports": get_all_cars(status_filter=status)}


@app.patch("/api/reports/{report_id}/status")
def api_update_report_status(report_id: int, payload: StatusUpdate, user: dict = Depends(require_role("administration", "admin"))):
    """Administration sets a report to Found / Not Found (or Under Review)
    after watching the detection footage."""
    if payload.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"status must be one of {sorted(VALID_STATUSES)}")
    ok = update_report_status(report_id, payload.status, user["id"], payload.notes)
    if not ok:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"success": True}


@app.delete("/api/reports/{report_id}")
def api_delete_report(report_id: int, user: dict = Depends(require_role("admin"))):
    ok = delete_car(report_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"success": True}


# API: admin -- manage who has which role

@app.get("/api/admin/users")
def api_list_users(user: dict = Depends(require_role("admin"))):
    return {"users": list_profiles()}


class RoleUpdate(BaseModel):
    role: str  # 'user' | 'administration' | 'admin'


@app.patch("/api/admin/users/{target_user_id}/role")
def api_set_user_role(target_user_id: str, payload: RoleUpdate, user: dict = Depends(require_role("admin"))):
    if payload.role not in ("user", "administration", "admin"):
        raise HTTPException(status_code=400, detail="role must be user, administration, or admin")
    ok = set_profile_role(target_user_id, payload.role)
    if not ok:
        raise HTTPException(status_code=404, detail="User not found")
    return {"success": True}



# API: video detection

def process_video_stream(in_path, source_filename, job_id):
    """High-Performance Real-Time ANPR Streaming Pipeline.
    
    1. Video playback runs smoothly at native video FPS.
    2. Background box_worker runs full-frame vehicle and plate detection in parallel (~35ms).
    3. Plates are immediately localized and tracked on the canvas from the very first frame.
    4. Background plate_worker OCRs plates asynchronously with enhanced Lanczos & CLAHE filters.
    5. Frames and bounding boxes are streamed together in a single optimized payload.
    """
    cap = cv2.VideoCapture(in_path)
    if not cap.isOpened():
        yield {"type": "error", "message": "Could not read video file"}
        return

    fps = cap.get(cv2.CAP_PROP_FPS) or 25
    # Moderate playback pace (~12 FPS) as requested by user,
    # giving the AI model and OCR ample time to detect and recognize plates reliably.
    display_fps = min(12.0, fps) if fps > 12 else fps
    frame_interval = 1.0 / display_fps
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total_frames_hint = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or None

    out_name = f"{job_id}_output.mp4"
    out_path = os.path.join(OUTPUTS_DIR, out_name)
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(out_path, fourcc, fps, (width, height))

    latest = {"frame": None, "idx": 0}
    latest_lock = threading.Lock()
    tracks_lock = threading.Lock()
    tracks = []
    matched_track_ids = set()
    results_q = queue.Queue()
    detections_log = []
    stop_event = threading.Event()

    # 40 frames (~1.3s at 30fps) allows continuous smooth tracking through fast motion
    MAX_PREDICT_FRAMES = 40

    def box_worker():
        """Fast AI loop: detects all vehicles and all plates across the whole frame
        in two fast YOLO passes (~35-45ms total). Associates plates to cars geometrically
        and tracks them with velocity prediction at native video speed."""
        print(f"[box_worker] STARTED for job {job_id}", flush=True)
        last_done_idx = -1
        while not stop_event.is_set():
            with latest_lock:
                frame = None if latest["frame"] is None else latest["frame"].copy()
                idx = latest["idx"]
            if frame is None or idx == last_done_idx:
                time.sleep(0.003)
                continue
            last_done_idx = idx

            try:
                detect_frame, low_light = enhance_low_light(frame)
                cars = detect_cars(detect_frame, low_light)
                plates = detect_plates_full(detect_frame, low_light)

                with tracks_lock:
                    used_ids = set()
                    # 1. Update vehicle tracks
                    for car_box in cars:
                        best_track, best_score = None, 0.0
                        for t in tracks:
                            if t["id"] in used_ids:
                                continue
                            elapsed = idx - t["last_update_frame"]
                            vx1, vy1, vx2, vy2 = t["velocity"]
                            pred_box = (
                                t["box"][0] + vx1 * elapsed, t["box"][1] + vy1 * elapsed,
                                t["box"][2] + vx2 * elapsed, t["box"][3] + vy2 * elapsed
                            )
                            score = max(_iou(car_box, t["box"]), _iou(car_box, pred_box))
                            if score > best_score:
                                best_score, best_track = score, t

                        thresh = (IOU_MATCH_THRESHOLD * 0.6) if (best_track and (idx - best_track["last_update_frame"]) > 1) else IOU_MATCH_THRESHOLD
                        if best_track is not None and best_score >= thresh:
                            elapsed = max(1, idx - best_track["last_update_frame"])
                            ox1, oy1, ox2, oy2 = best_track["box"]
                            nx1, ny1, nx2, ny2 = car_box
                            curr_vx1, curr_vy1, curr_vx2, curr_vy2 = (
                                (nx1 - ox1) / elapsed, (ny1 - oy1) / elapsed,
                                (nx2 - ox2) / elapsed, (ny2 - oy2) / elapsed,
                            )
                            ovx1, ovy1, ovx2, ovy2 = best_track["velocity"]
                            best_track["velocity"] = (
                                0.7 * curr_vx1 + 0.3 * ovx1,
                                0.7 * curr_vy1 + 0.3 * ovy1,
                                0.7 * curr_vx2 + 0.3 * ovx2,
                                0.7 * curr_vy2 + 0.3 * ovy2,
                            )
                            best_track["box"] = car_box
                            best_track["last_update_frame"] = idx
                            best_track["last_seen"] = idx
                            used_ids.add(best_track["id"])
                        else:
                            best_track = {
                                "id": uuid.uuid4().hex[:8],
                                "box": car_box,
                                "velocity": (0.0, 0.0, 0.0, 0.0),
                                "plate_text": "",
                                "plate_box_rel": None,
                                "matched": False,
                                "checked_at": 0,
                                "last_update_frame": idx,
                                "last_seen": idx,
                            }
                            tracks.append(best_track)
                            used_ids.add(best_track["id"])

                        # Match plates to this car geometrically
                        cx1, cy1, cx2, cy2 = car_box
                        car_w, car_h = max(1, cx2 - cx1), max(1, cy2 - cy1)
                        matched_plate = None
                        for px1, py1, px2, py2, pconf in plates:
                            pmid_x = (px1 + px2) / 2
                            pmid_y = (py1 + py2) / 2
                            if cx1 - 10 <= pmid_x <= cx2 + 10 and cy1 <= pmid_y <= cy2 + 10:
                                matched_plate = (px1, py1, px2, py2)
                                break
                        
                        if matched_plate is not None:
                            px1, py1, px2, py2 = matched_plate
                            best_track["plate_box_rel"] = (
                                (px1 - cx1) / car_w, (py1 - cy1) / car_h,
                                (px2 - cx1) / car_w, (py2 - cy1) / car_h,
                            )

                        plate_text = best_track["plate_text"]
                        db_car = find_car_in_db(plate_text) if plate_text else None
                        best_track["matched"] = bool(db_car)

                    # 2. Handle any standalone plates not inside a detected car
                    for px1, py1, px2, py2, pconf in plates:
                        pmid_x = (px1 + px2) / 2
                        pmid_y = (py1 + py2) / 2
                        already_associated = False
                        for t in tracks:
                            cx1, cy1, cx2, cy2 = t["box"]
                            if cx1 - 10 <= pmid_x <= cx2 + 10 and cy1 <= pmid_y <= cy2 + 10:
                                already_associated = True
                                break
                        if not already_associated:
                            p_pad_w = int((px2 - px1) * 0.8)
                            p_pad_h = int((py2 - py1) * 1.5)
                            cbox = (max(0, px1 - p_pad_w), max(0, py1 - p_pad_h), px2 + p_pad_w, py2 + p_pad_h)
                            car_w, car_h = max(1, cbox[2] - cbox[0]), max(1, cbox[3] - cbox[1])
                            t_new = {
                                "id": uuid.uuid4().hex[:8],
                                "box": cbox,
                                "velocity": (0.0, 0.0, 0.0, 0.0),
                                "plate_text": "",
                                "plate_box_rel": (
                                    (px1 - cbox[0]) / car_w, (py1 - cbox[1]) / car_h,
                                    (px2 - cbox[0]) / car_w, (py2 - cbox[1]) / car_h,
                                ),
                                "matched": False,
                                "checked_at": 0,
                                "last_update_frame": idx,
                                "last_seen": idx,
                            }
                            tracks.append(t_new)

                    tracks[:] = [t for t in tracks if idx - t["last_seen"] <= RECHECK_EVERY * 4]
            except Exception:
                import traceback, sys
                print(f"[box_worker] ERROR analyzing frame {idx}:", flush=True)
                traceback.print_exc(file=sys.stdout)
                sys.stdout.flush()

    def plate_worker():
        """Dedicated OCR worker loop: reads plates asynchronously without slowing down video playback."""
        print(f"[plate_worker] STARTED for job {job_id}", flush=True)
        attempts = 0
        successes = 0
        while not stop_event.is_set():
            try:
                with tracks_lock:
                    snap_idx = latest["idx"]
                    candidates = [t for t in tracks if t.get("plate_box_rel") is not None and (not t["plate_text"] or (snap_idx - t["checked_at"]) >= RECHECK_EVERY)]
                    candidates.sort(key=lambda t: (bool(t["plate_text"]), t["checked_at"]))
                    target_id = candidates[0]["id"] if candidates else None

                if not target_id:
                    time.sleep(0.02)
                    continue

                with latest_lock:
                    frame = None if latest["frame"] is None else latest["frame"].copy()
                    idx = latest["idx"]
                if frame is None:
                    time.sleep(0.02)
                    continue

                with tracks_lock:
                    target = next((t for t in tracks if t["id"] == target_id), None)
                    target_box = target["box"] if target else None
                    target_rel = target.get("plate_box_rel") if target else None

                if target_box is None or target_rel is None:
                    continue

                cx1, cy1, cx2, cy2 = target_box
                car_w, car_h = max(1, cx2 - cx1), max(1, cy2 - cy1)
                rx1, ry1, rx2, ry2 = target_rel
                px1 = max(0, int(cx1 + rx1 * car_w))
                py1 = max(0, int(cy1 + ry1 * car_h))
                px2 = min(frame.shape[1], int(cx1 + rx2 * car_w))
                py2 = min(frame.shape[0], int(cy1 + ry2 * car_h))

                pad_x = max(4, int((px2 - px1) * 0.12))
                pad_y = max(3, int((py2 - py1) * 0.12))
                cpx1 = max(0, px1 - pad_x)
                cpy1 = max(0, py1 - pad_y)
                cpx2 = min(frame.shape[1], px2 + pad_x)
                cpy2 = min(frame.shape[0], py2 + pad_y)

                plate_crop = frame[cpy1:cpy2, cpx1:cpx2]
                new_text = read_plate(plate_crop, low_light=False)

                # Fallback to fresh detect_plate if relative crop gave no text
                if not new_text:
                    pbox_fresh, pcrop_fresh = detect_plate(frame, target_box, low_light=False)
                    if pcrop_fresh is not None:
                        new_text = read_plate(pcrop_fresh, low_light=False)
                        if pbox_fresh is not None:
                            px1, py1, px2, py2 = pbox_fresh
                            target_rel = (
                                (px1 - cx1) / car_w, (py1 - cy1) / car_h,
                                (px2 - cx1) / car_w, (py2 - cy1) / car_h,
                            )

                attempts += 1
                if new_text:
                    successes += 1
                    print(f"[plate_worker] attempt #{attempts}: track {target_id} -> '{new_text}'", flush=True)

                with tracks_lock:
                    for t in tracks:
                        if t["id"] == target_id:
                            if new_text:
                                t["plate_text"] = new_text
                            t["checked_at"] = idx
                            
                            # Check stolen car match
                            check_text = new_text or t["plate_text"]
                            db_car = find_car_in_db(check_text) if check_text else None
                            t["matched"] = bool(db_car)
                            if db_car:
                                t["plate_text"] = db_car["plate"]

                            if db_car and t["id"] not in matched_track_ids:
                                matched_track_ids.add(t["id"])
                                x1, y1, x2, y2 = t["box"]
                                snap = frame.copy()
                                cv2.rectangle(snap, (x1, y1), (x2, y2), (0, 0, 255), 3)
                                cv2.rectangle(snap, (px1, py1), (px2, py2), (0, 0, 255), 2)
                                label = f"STOLEN: {db_car['plate']}"
                                (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.8, 2)
                                cv2.rectangle(snap, (x1, max(0, y1 - th - 12)), (x1 + tw + 8, y1), (0, 0, 255), -1)
                                cv2.putText(snap, label, (x1 + 4, max(th + 4, y1 - 4)), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

                                ts = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
                                capture_name = f"{db_car['plate']}_{idx}_{ts}.jpg"
                                cv2.imwrite(os.path.join(DETECTIONS_DIR, capture_name), snap)

                                video_time = round(idx / fps, 1)
                                save_detection(db_car, idx, video_time, capture_name, source_filename)

                                det = {
                                    "frame": idx, "time": video_time, "plate": db_car["plate"],
                                    "owner": db_car["owner"], "model": db_car["model"], "color": db_car["color"],
                                    "image_url": f"/files/detections/{capture_name}",
                                }
                                detections_log.append(det)
                                results_q.put({"type": "alert", **det})
                            break
            except Exception:
                import traceback, sys
                print(f"[plate_worker] ERROR (loop continues):", flush=True)
                traceback.print_exc(file=sys.stdout)
                sys.stdout.flush()
                time.sleep(0.05)

    box_thread = threading.Thread(target=box_worker, daemon=True)
    plate_thread = threading.Thread(target=plate_worker, daemon=True)
    box_thread.start()
    plate_thread.start()

    frame_idx = 0
    stream_scale = None
    next_tick = time.monotonic()

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frame_idx += 1

        with latest_lock:
            latest["frame"] = frame
            latest["idx"] = frame_idx

        writer.write(frame)

        # Drain whatever alert results have arrived so far
        while True:
            try:
                yield results_q.get_nowait()
            except queue.Empty:
                break

        # Compute smooth velocity-predicted box and plate positions
        with tracks_lock:
            boxes_out = []
            for t in tracks:
                elapsed = frame_idx - t["last_update_frame"]
                if elapsed > MAX_PREDICT_FRAMES:
                    continue
                vx1, vy1, vx2, vy2 = t["velocity"]
                x1 = t["box"][0] + vx1 * elapsed
                y1 = t["box"][1] + vy1 * elapsed
                x2 = t["box"][2] + vx2 * elapsed
                y2 = t["box"][3] + vy2 * elapsed

                plate_box = None
                rel = t.get("plate_box_rel")
                if rel is not None:
                    rx1, ry1, rx2, ry2 = rel
                    car_w, car_h = (x2 - x1), (y2 - y1)
                    plate_box = {
                        "x1": x1 + rx1 * car_w, "y1": y1 + ry1 * car_h,
                        "x2": x1 + rx2 * car_w, "y2": y1 + ry2 * car_h,
                    }

                boxes_out.append({
                    "x1": x1, "y1": y1, "x2": x2, "y2": y2,
                    "plate": t["plate_text"],
                    "matched": t["matched"],
                    "plate_box": plate_box,
                })

        h, w = frame.shape[:2]
        if stream_scale is None:
            stream_scale = min(1.0, 720.0 / w)
        small = cv2.resize(frame, (int(w * stream_scale), int(h * stream_scale))) if stream_scale < 1.0 else frame
        ok, buf = cv2.imencode(".jpg", small, [cv2.IMWRITE_JPEG_QUALITY, 65])
        if ok:
            yield {
                "type": "frame",
                "frame_idx": frame_idx,
                "video_time": round(frame_idx / fps, 2),
                "total_frames": total_frames_hint,
                "image_b64": base64.b64encode(buf).decode("utf-8"),
                "scale": stream_scale,
                "boxes": boxes_out,
            }

        # Pace playback to video native FPS
        next_tick += frame_interval
        delay = next_tick - time.monotonic()
        if delay > 0:
            time.sleep(delay)
        else:
            next_tick = time.monotonic()

    stop_event.set()
    box_thread.join(timeout=2)
    plate_thread.join(timeout=2)
    while True:
        try:
            yield results_q.get_nowait()
        except queue.Empty:
            break

    cap.release()
    writer.release()

    yield {
        "type": "done",
        "total_frames": frame_idx,
        "stolen_count": len(detections_log),
        "detections": detections_log,
        "output_video_url": f"/files/outputs/{out_name}",
    }


@app.post("/api/detect/video")
async def api_detect_video(file: UploadFile = File(...), user: dict = Depends(require_role("administration", "admin"))):
    """Legacy one-shot endpoint: processes the whole video, then returns a
    single JSON summary. Kept for non-WebSocket clients -- for the live
    experience use /api/detect/video/start + /ws/detect/{job_id} instead."""
    if car_model is None:
        raise HTTPException(status_code=503, detail="Models still loading, try again shortly")

    uid = uuid.uuid4().hex[:8]
    in_path = os.path.join(UPLOADS_DIR, f"{uid}_{file.filename}")
    with open(in_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    final = None
    for item in process_video_stream(in_path, file.filename, uid):
        if item["type"] == "error":
            raise HTTPException(status_code=400, detail=item["message"])
        if item["type"] == "done":
            final = item

    return JSONResponse(final)


@app.post("/api/detect/video/start")
async def api_start_video_job(file: UploadFile = File(...), user: dict = Depends(require_role("administration", "admin"))):
    """Step 1 of the live-detection flow: save the uploaded video and hand
    back a job_id. The frontend then opens /ws/detect/{job_id} to watch
    detection happen live instead of waiting for the whole video."""
    if car_model is None:
        raise HTTPException(status_code=503, detail="Models still loading, try again shortly")

    job_id = uuid.uuid4().hex[:8]
    in_path = os.path.join(UPLOADS_DIR, f"{job_id}_{file.filename}")
    with open(in_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    PENDING_VIDEO_JOBS[job_id] = (in_path, file.filename)
    return {"job_id": job_id}


@app.websocket("/ws/ping")
async def ws_ping(websocket: WebSocket):
    """Diagnostic only: confirms whether WebSocket connections reach this
    server at all. Test from the browser console:
        const ws = new WebSocket("ws://localhost:8000/ws/ping");
        ws.onopen = () => console.log("OPEN");
        ws.onmessage = (e) => console.log("MESSAGE:", e.data);
        ws.onerror = (e) => console.log("ERROR", e);
        ws.onclose = (e) => console.log("CLOSE", e.code, e.reason);
    If this also fails with a 400/rejected, the problem is something
    intercepting ALL WebSocket traffic to this server (antivirus,
    firewall, proxy, VPN) -- not specific to the detection endpoint.
    """
    await websocket.accept()
    await websocket.send_text("pong")
    await websocket.close()


@app.websocket("/ws/detect/{job_id}")
async def ws_detect_video(websocket: WebSocket, job_id: str):
    """Step 2: streams processed frames back to the client live, as YOLO
    finishes each one, instead of only sending a result once the whole
    video has been processed.

    No token needed here: job_id is an unguessable one-time-use random
    ID that only exists because a prior /api/detect/video/start request
    already passed the Administration/Admin role check -- popping it
    from PENDING_VIDEO_JOBS (single use, and removed immediately) is
    the authorization for this step."""
    await websocket.accept()

    job = PENDING_VIDEO_JOBS.pop(job_id, None)
    if not job:
        await websocket.send_json({"type": "error", "message": "Unknown or already-used job_id"})
        await websocket.close()
        return

    in_path, source_filename = job

    # process_video_stream() does blocking CV/YOLO work, so it runs on a
    # background thread; results are handed to the async websocket loop
    # through a thread-safe queue so we can await/send without blocking
    # the event loop.
    result_queue = queue.Queue(maxsize=64)
    STOP = object()

    def worker():
        try:
            for item in process_video_stream(in_path, source_filename, job_id):
                result_queue.put(item)
        except Exception as e:
            result_queue.put({"type": "error", "message": str(e)})
        finally:
            result_queue.put(STOP)

    threading.Thread(target=worker, daemon=True).start()

    loop = asyncio.get_event_loop()
    try:
        while True:
            item = await loop.run_in_executor(None, result_queue.get)
            if item is STOP:
                break
            await websocket.send_json(item)
            if item.get("type") in ("done", "error"):
                break
    except WebSocketDisconnect:
        pass
    finally:
        try:
            await websocket.close()
        except Exception:
            pass


# API: Gemini AI assistant (general purpose chatbot)

class ChatTurn(BaseModel):
    role: str  # "user" or "assistant"
    text: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatTurn]] = None


@app.post("/api/chat")
def api_chat(req: ChatRequest, user: dict = Depends(require_role())):
    if gemini_client is None:
        raise HTTPException(
            status_code=503,
            detail="GEMINI_API_KEY is not configured on the server. Add it to backend/.env and restart.",
        )

    contents = []
    for turn in (req.history or [])[-20:]:
        role = "user" if turn.role == "user" else "model"
        contents.append({"role": role, "parts": [{"text": turn.text}]})
    contents.append({"role": "user", "parts": [{"text": req.message}]})

    models_to_try = [
        GEMINI_MODEL,
        "gemini-3.5-flash-lite",
        "gemini-3.6-flash",
    ]
    last_err = None
    for model_name in models_to_try:
        try:
            response = gemini_client.models.generate_content(
                model=model_name,
                contents=contents,
            )
            return {"reply": response.text}
        except Exception as e:
            last_err = e
            print(f"[api_chat] Model {model_name} returned error: {e}. Trying fallback model...", flush=True)
            continue

    raise HTTPException(status_code=502, detail=f"Gemini request failed: {last_err}")


# API: detection screenshots

@app.get("/api/detections")
def api_list_detections(user: dict = Depends(require_role("administration", "admin"))):
    return {"detections": get_all_detections()}



# API: export watch database as CSV

@app.get("/api/cars/export")
def api_export_cars_csv(user: dict = Depends(require_role("admin"))):
    import csv
    import io

    cars = get_all_cars()
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["plate_number", "owner_name", "car_model", "car_color", "date_added", "status"])
    for car in cars:
        writer.writerow([car["plate"], car["owner"], car["model"], car["color"], car["date_added"], car["status"]])
    buf.seek(0)

    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=stolen_cars_database.csv"},
    )


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "car_model_loaded": car_model is not None,
        "plate_model_loaded": plate_model is not None,
        "gemini_ready": gemini_client is not None,
    }
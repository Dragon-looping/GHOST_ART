import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from app.database import (
    UPLOADS_DIR,
    generate_artwork_id,
    get_all_artworks,
    get_db_connection,
    init_db,
    save_artwork,
)
from app.fingerprint import (
    calculate_phash,
    calculate_sha256,
    calculate_similarity_score,
    compute_phash_distance,
)
from app.gemini_service import analyze_artwork_image, compare_artwork_images
from app.zk_service import (
    generate_commitment,
    generate_zk_proof,
    get_zk_status,
    save_vault_secret,
    verify_zk_proof,
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager to initialize DB and directories on startup."""
    init_db()
    yield


# Initialize FastAPI application
app = FastAPI(
    title="Ghost Art API",
    description="Backend API for Ghost Art MVP",
    version="0.5.0",
    lifespan=lifespan,
)

# Enable CORS for React frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure uploads directory exists and mount for static image serving
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")


@app.get("/health")
def health_check():
    """Health endpoint confirming that the API server is running."""
    return {
        "status": "ok",
        "message": "Ghost Art API is running"
    }


@app.get("/artworks")
def list_artworks():
    """Retrieve all registered artworks."""
    return {
        "status": "success",
        "artworks": get_all_artworks()
    }


@app.get("/artworks/{artwork_id}/image")
def get_artwork_image(artwork_id: str):
    """Serve the registered image file for a given artwork ID."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT image_path FROM artworks WHERE id = ?", (artwork_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Artwork not found")
        img_path = Path(row["image_path"])
        if not img_path.exists():
            raise HTTPException(status_code=404, detail="Artwork image file not found on disk")
        return FileResponse(img_path)


@app.post("/register")
async def register_artwork(
    file: UploadFile = File(...),
    title: str = Form("Untitled"),
    creator: str = Form("Anonymous"),
):
    """
    Register a new artwork image:
    1. Read and validate uploaded image file
    2. Compute cryptographic SHA-256 hash and perceptual pHash
    3. Generate simple sequential artwork ID (e.g. ART-001)
    4. Save image locally to data/uploads directory
    5. Store artwork metadata and fingerprints in SQLite
    """
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="Image file is required")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    # Compute fingerprints and validate image format
    try:
        sha256_hash = calculate_sha256(contents)
        phash_val = calculate_phash(contents)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is not a valid image format"
        )

    # Generate sequential artwork ID (ART-001, ART-002, etc.)
    artwork_id = generate_artwork_id()

    # Determine extension and save image to data/uploads
    ext = Path(file.filename).suffix.lower()
    valid_extensions = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"}
    if ext not in valid_extensions:
        ext = ".png"

    saved_filename = f"{artwork_id}{ext}"
    dest_path = UPLOADS_DIR / saved_filename

    try:
        with open(dest_path, "wb") as f:
            f.write(contents)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save image file: {str(e)}"
        )

    # Generate Zero-Knowledge commitment: Poseidon(fingerprint, secret) == commitment
    zk_commitment = None
    try:
        zk_res = generate_commitment(fingerprint=phash_val)
        zk_commitment = zk_res["commitment"]
        # Save secret in server-side private vault ONLY (never stored in SQLite, never returned to frontend)
        save_vault_secret(
            artwork_id=artwork_id,
            secret=zk_res["secret"],
            fingerprint=zk_res["fingerprint"],
            commitment=zk_commitment
        )
    except Exception as e:
        logger.warning(f"ZK commitment generation skipped/failed for {artwork_id}: {e}")

    created_at = datetime.now(timezone.utc).isoformat()
    try:
        artwork_record = save_artwork(
            artwork_id=artwork_id,
            title=title.strip() if title else "Untitled",
            creator=creator.strip() if creator else "Anonymous",
            sha256=sha256_hash,
            phash=phash_val,
            image_path=str(dest_path.as_posix()),
            created_at=created_at,
            zk_commitment=zk_commitment
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )

    return {
        "status": "success",
        "message": "Artwork registered successfully",
        "artwork": artwork_record
    }


@app.post("/trace")
async def trace_artwork(
    file: UploadFile = File(...),
    limit: int = 5,
):
    """
    Trace a suspected artwork image:
    1. Read and validate uploaded image file
    2. Compute perceptual pHash for suspected artwork
    3. Retrieve registered artworks from SQLite and compute similarity scores
    4. Rank candidates descending by visual similarity
    5. Perform Gemini visual comparison on top candidate if available
    """
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="Image file is required")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    try:
        query_phash = calculate_phash(contents)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is not a valid image format"
        )

    artworks = get_all_artworks()
    if not artworks:
        return {
            "status": "success",
            "message": "No registered artworks found in database",
            "query_phash": query_phash,
            "candidates": [],
            "gemini_analysis": None,
            "gemini_status": "No registered artwork candidates available for comparison"
        }

    candidates = []
    for art in artworks:
        dist = compute_phash_distance(query_phash, art["phash"])
        score = calculate_similarity_score(dist)
        candidates.append({
            "id": art["id"],
            "title": art["title"],
            "creator": art["creator"],
            "similarity_score": score,
            "phash_distance": dist,
            "image_path": art["image_path"],
            "sha256": art["sha256"],
            "phash": art["phash"],
            "created_at": art["created_at"],
            "zk_commitment": art.get("zk_commitment"),
        })

    candidates.sort(key=lambda item: item["similarity_score"], reverse=True)
    top_candidates = candidates[:max(1, limit)]

    # Gemini visual comparison on top candidate
    gemini_analysis = None
    gemini_status = "Not attempted"

    if top_candidates:
        top_cand = top_candidates[0]
        orig_image_path = Path(top_cand["image_path"])

        if orig_image_path.exists():
            try:
                with open(orig_image_path, "rb") as f:
                    orig_bytes = f.read()

                suffix = orig_image_path.suffix.lower()
                mime_map = {
                    ".png": "image/png",
                    ".jpg": "image/jpeg",
                    ".jpeg": "image/jpeg",
                    ".webp": "image/webp",
                    ".gif": "image/gif",
                    ".bmp": "image/bmp"
                }
                orig_mime = mime_map.get(suffix, "image/png")
                query_mime = file.content_type or "image/png"

                gemini_analysis = compare_artwork_images(
                    original_bytes=orig_bytes,
                    original_mime=orig_mime,
                    candidate_bytes=contents,
                    candidate_mime=query_mime
                )
                gemini_status = "completed"
            except Exception as e:
                gemini_analysis = None
                gemini_status = f"Gemini analysis unavailable: {str(e)}"
        else:
            gemini_status = "Original artwork image file not found on disk"

    return {
        "status": "success",
        "message": f"Found {len(top_candidates)} candidate match(es)",
        "query_phash": query_phash,
        "candidates": top_candidates,
        "gemini_analysis": gemini_analysis,
        "gemini_status": gemini_status
    }


@app.post("/analyze-artwork")
async def analyze_artwork_endpoint(
    file: UploadFile = File(...),
):
    """
    Analyze an uploaded artwork image using Google Gemini API:
    1. Describes visual content, style, and subject matter
    2. Identifies key distinctive visual elements
    Note: Does NOT make legal conclusions regarding copyright or ownership.
    """
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="Image file is required")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    content_type = file.content_type or "image/png"

    try:
        analysis = analyze_artwork_image(contents, mime_type=content_type)
        return {
            "status": "success",
            "analysis": analysis
        }
    except ValueError as ve:
        raise HTTPException(status_code=503, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/compare-artworks")
async def compare_artworks_endpoint(
    original_file: UploadFile = File(...),
    candidate_file: UploadFile = File(...),
):
    """
    Compare an original artwork against a candidate artwork using Google Gemini API:
    1. Compares visual similarities and differences
    2. Identifies visible modifications (cropping, recoloring, filters, added text, etc.)
    Note: Does NOT make legal conclusions regarding copyright infringement.
    """
    if not original_file or not original_file.filename:
        raise HTTPException(status_code=400, detail="Original artwork image file is required")
    if not candidate_file or not candidate_file.filename:
        raise HTTPException(status_code=400, detail="Candidate artwork image file is required")

    orig_contents = await original_file.read()
    cand_contents = await candidate_file.read()

    if not orig_contents or not cand_contents:
        raise HTTPException(status_code=400, detail="Uploaded image files cannot be empty")

    orig_mime = original_file.content_type or "image/png"
    cand_mime = candidate_file.content_type or "image/png"

    try:
        comparison = compare_artwork_images(
            original_bytes=orig_contents,
            original_mime=orig_mime,
            candidate_bytes=cand_contents,
            candidate_mime=cand_mime
        )
        return {
            "status": "success",
            "comparison": comparison
        }
    except ValueError as ve:
        raise HTTPException(status_code=503, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Zero-Knowledge Proof Endpoints (Groth16 + Poseidon)
# ---------------------------------------------------------------------------

class ZKProveRequest(BaseModel):
    artwork_id: str = Field(description="The ID of the registered reference artwork to prove.")
    secret: str | None = Field(default=None, description="Optional private secret override if not using server vault.")


class ZKProveResponse(BaseModel):
    valid: bool
    artwork_id: str
    commitment: str
    proof: dict[str, Any]
    public_signals: list[str]
    message: str


class ZKVerifyRequest(BaseModel):
    artwork_id: str | None = Field(default=None, description="The artwork ID to verify against SQLite commitment.")
    commitment: str | None = Field(default=None, description="The expected Poseidon commitment if artwork_id not provided.")
    proof: dict[str, Any] = Field(description="Groth16 proof object.")
    public_signals: list[str] = Field(description="Public signals vector containing public commitment.")


class ZKVerifyResponse(BaseModel):
    valid: bool
    artwork_id: str | None = None
    commitment: str | None = None
    message: str


@app.get("/zk/status")
def zk_status_endpoint():
    """
    Return status of the Zero-Knowledge subsystem, circuit artifacts,
    and cryptographic keys.
    """
    return get_zk_status()


@app.post("/zk/prove", response_model=ZKProveResponse)
async def zk_prove_endpoint(req: ZKProveRequest):
    """
    Generate a Groth16 zero-knowledge proof proving knowledge of the registered artwork secret
    without revealing the secret itself.
    Formula: Poseidon(fingerprint, secret) == commitment
    """
    try:
        res = generate_zk_proof(artwork_id=req.artwork_id, secret=req.secret)
        return ZKProveResponse(
            valid=True,
            artwork_id=req.artwork_id,
            commitment=res["commitment"],
            proof=res["proof"],
            public_signals=res["public_signals"],
            message=res.get("message", "Zero-knowledge proof generated successfully")
        )
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except FileNotFoundError as fnf:
        raise HTTPException(status_code=503, detail=str(fnf))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate ZK proof: {str(e)}")


@app.post("/zk/verify", response_model=ZKVerifyResponse)
async def zk_verify_endpoint(req: ZKVerifyRequest):
    """
    Verify a Groth16 zero-knowledge proof against the verification key and registered commitment.
    Does NOT leak the secret or private witness.
    """
    try:
        res = verify_zk_proof(
            proof=req.proof,
            public_signals=req.public_signals,
            artwork_id=req.artwork_id,
            expected_commitment=req.commitment
        )
        return ZKVerifyResponse(
            valid=res["valid"],
            artwork_id=res.get("artwork_id"),
            commitment=res.get("commitment"),
            message=res["message"]
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"ZK verification error: {str(e)}")


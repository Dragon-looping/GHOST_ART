from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.database import (
    UPLOADS_DIR,
    generate_artwork_id,
    get_all_artworks,
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


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager to initialize DB and directories on startup."""
    init_db()
    yield


# Initialize FastAPI application
app = FastAPI(
    title="Ghost Art API",
    description="Backend API for Ghost Art MVP",
    version="0.4.0",
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


@app.get("/health")
def health_check():
    """Health endpoint confirming that the API server is running."""
    return {
        "status": "ok",
        "message": "Ghost Art API is running"
    }


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

    created_at = datetime.now(timezone.utc).isoformat()
    try:
        artwork_record = save_artwork(
            artwork_id=artwork_id,
            title=title.strip() if title else "Untitled",
            creator=creator.strip() if creator else "Anonymous",
            sha256=sha256_hash,
            phash=phash_val,
            image_path=str(dest_path.as_posix()),
            created_at=created_at
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
    3. Retrieve all registered artworks from SQLite
    4. Compute pHash Hamming distance and visual similarity score
    5. Return candidates sorted from highest to lowest similarity
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
            "candidates": []
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
        })

    candidates.sort(key=lambda item: item["similarity_score"], reverse=True)
    top_candidates = candidates[:max(1, limit)]

    return {
        "status": "success",
        "message": f"Found {len(top_candidates)} candidate match(es)",
        "query_phash": query_phash,
        "candidates": top_candidates
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

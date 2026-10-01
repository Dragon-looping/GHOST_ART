from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.database import UPLOADS_DIR, generate_artwork_id, init_db, save_artwork
from app.fingerprint import calculate_phash, calculate_sha256


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager to initialize DB and directories on startup."""
    init_db()
    yield


# Initialize FastAPI application
app = FastAPI(
    title="Ghost Art API",
    description="Backend API for Ghost Art MVP",
    version="0.2.0",
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

    # Record timestamp and store metadata in SQLite
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
def trace_artwork():
    """Placeholder endpoint for artwork tracing (logic to be implemented in future parts)."""
    return {
        "status": "placeholder",
        "message": "Artwork trace endpoint placeholder"
    }

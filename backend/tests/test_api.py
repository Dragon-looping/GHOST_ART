import io
import os
import shutil
import sqlite3
import pytest
from pathlib import Path
from PIL import Image
from fastapi import HTTPException, UploadFile

from app.main import (
    analyze_artwork_endpoint,
    compare_artworks_endpoint,
    health_check,
    register_artwork,
    trace_artwork,
)
from app.database import DB_PATH, DATA_DIR, UPLOADS_DIR, init_db


@pytest.fixture(autouse=True)
def setup_test_db(tmp_path, monkeypatch):
    """Fixture to set up a clean temporary database and upload directory for each test."""
    test_data_dir = tmp_path / "data"
    test_uploads_dir = test_data_dir / "uploads"
    test_db_path = test_data_dir / "ghost_art.db"

    test_data_dir.mkdir(parents=True, exist_ok=True)
    test_uploads_dir.mkdir(parents=True, exist_ok=True)

    # Patch database paths in database module
    monkeypatch.setattr("app.database.DATA_DIR", test_data_dir)
    monkeypatch.setattr("app.database.UPLOADS_DIR", test_uploads_dir)
    monkeypatch.setattr("app.database.DB_PATH", test_db_path)
    monkeypatch.setattr("app.main.UPLOADS_DIR", test_uploads_dir)

    init_db()
    yield


def create_test_image(color="blue", size=(100, 100)) -> bytes:
    """Helper to generate a simple in-memory image."""
    img = Image.new("RGB", size, color=color)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def test_health_endpoint():
    """Test the GET /health endpoint."""
    response = health_check()
    assert response["status"] == "ok"
    assert "Ghost Art API is running" in response["message"]


@pytest.mark.asyncio
async def test_empty_database_trace():
    """Test tracing an artwork when no artworks are registered in the database."""
    img_bytes = create_test_image("red")
    upload = UploadFile(filename="suspected.png", file=io.BytesIO(img_bytes))

    response = await trace_artwork(file=upload, limit=5)
    assert response["status"] == "success"
    assert response["message"] == "No registered artworks found in database"
    assert "query_phash" in response
    assert response["candidates"] == []


@pytest.mark.asyncio
async def test_register_artwork():
    """Test registering a valid artwork image."""
    img_bytes = create_test_image("green")
    upload = UploadFile(filename="mona_lisa.png", file=io.BytesIO(img_bytes))

    response = await register_artwork(file=upload, title="Mona Lisa", creator="Da Vinci")
    assert response["status"] == "success"
    assert response["artwork"]["id"] == "ART-001"
    assert response["artwork"]["title"] == "Mona Lisa"
    assert response["artwork"]["creator"] == "Da Vinci"
    assert len(response["artwork"]["sha256"]) == 64
    assert len(response["artwork"]["phash"]) > 0


@pytest.mark.asyncio
async def test_trace_artwork():
    """Test tracing a registered artwork to verify matching and similarity scoring."""
    img_bytes = create_test_image("yellow")
    reg_upload = UploadFile(filename="original.png", file=io.BytesIO(img_bytes))
    await register_artwork(file=reg_upload, title="Original Yellow", creator="Artist A")

    trace_upload = UploadFile(filename="suspected_copy.png", file=io.BytesIO(img_bytes))
    response = await trace_artwork(file=trace_upload, limit=5)

    assert response["status"] == "success"
    assert len(response["candidates"]) == 1

    candidate = response["candidates"][0]
    assert candidate["id"] == "ART-001"
    assert candidate["title"] == "Original Yellow"
    assert candidate["creator"] == "Artist A"
    assert candidate["similarity_score"] == 100.0
    assert candidate["phash_distance"] == 0


@pytest.mark.asyncio
async def test_invalid_image_upload():
    """Test uploading invalid/non-image content to register and trace endpoints."""
    invalid_file = UploadFile(filename="test.txt", file=io.BytesIO(b"Not an image file"))

    with pytest.raises(Exception):
        await register_artwork(file=invalid_file, title="Test", creator="Test")

    invalid_file_trace = UploadFile(filename="test.txt", file=io.BytesIO(b"Not an image file"))
    with pytest.raises(Exception):
        await trace_artwork(file=invalid_file_trace)


@pytest.mark.asyncio
async def test_gemini_missing_api_key_handling(monkeypatch):
    """Test that analyze and compare endpoints return 503 when GEMINI_API_KEY is not configured."""
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)

    img_bytes = create_test_image("purple")
    upload_analyze = UploadFile(filename="art1.png", file=io.BytesIO(img_bytes))
    orig_compare = UploadFile(filename="art1.png", file=io.BytesIO(img_bytes))
    cand_compare = UploadFile(filename="art2.png", file=io.BytesIO(img_bytes))

    with pytest.raises(HTTPException) as exc1:
        await analyze_artwork_endpoint(file=upload_analyze)
    assert exc1.value.status_code == 503
    assert "GEMINI_API_KEY is not configured" in exc1.value.detail

    with pytest.raises(HTTPException) as exc2:
        await compare_artworks_endpoint(original_file=orig_compare, candidate_file=cand_compare)
    assert exc2.value.status_code == 503
    assert "GEMINI_API_KEY is not configured" in exc2.value.detail

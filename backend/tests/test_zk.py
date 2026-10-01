import io
import json
import pytest
from pathlib import Path
from PIL import Image
from fastapi import HTTPException, UploadFile

from app.database import DB_PATH, DATA_DIR, UPLOADS_DIR, init_db, save_artwork
from app.main import (
    register_artwork,
    zk_prove_endpoint,
    zk_status_endpoint,
    zk_verify_endpoint,
    ZKProveRequest,
    ZKVerifyRequest,
)
from app.zk_service import (
    SNARK_FIELD,
    generate_commitment,
    generate_zk_proof,
    get_zk_status,
    save_vault_secret,
    verify_zk_proof,
)


@pytest.fixture(autouse=True)
def setup_test_db(tmp_path, monkeypatch):
    """Set up clean database and upload directory for each test."""
    test_data_dir = tmp_path / "data"
    test_uploads_dir = test_data_dir / "uploads"
    test_db_path = test_data_dir / "ghost_art.db"
    test_vault_path = test_data_dir / ".zk_vault.json"

    test_data_dir.mkdir(parents=True, exist_ok=True)
    test_uploads_dir.mkdir(parents=True, exist_ok=True)

    monkeypatch.setattr("app.database.DATA_DIR", test_data_dir)
    monkeypatch.setattr("app.database.UPLOADS_DIR", test_uploads_dir)
    monkeypatch.setattr("app.database.DB_PATH", test_db_path)
    monkeypatch.setattr("app.main.UPLOADS_DIR", test_uploads_dir)
    monkeypatch.setattr("app.zk_service.DATA_DIR", test_data_dir)
    monkeypatch.setattr("app.zk_service.VAULT_FILE", test_vault_path)

    init_db()
    yield


def create_test_image(color="purple", size=(80, 80)) -> bytes:
    """Helper to generate a simple in-memory PNG."""
    img = Image.new("RGB", size, color=color)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def test_zk_status():
    """Test GET /zk/status endpoint returns valid system status."""
    status = zk_status_endpoint()
    assert status["status"] == "ready"
    assert status["circuit"] == "ArtworkIdentity"
    assert status["protocol"] == "Groth16"
    assert status["has_wasm"] is True
    assert status["has_zkey"] is True
    assert status["has_vkey"] is True


def test_commitment_generation():
    """Test Poseidon commitment generation from fingerprint and secret."""
    fingerprint = "8000000000000000"
    secret = "123456789012345"

    res = generate_commitment(fingerprint=fingerprint, secret=secret)
    assert "fingerprint" in res
    assert "secret" in res
    assert "commitment" in res

    commitment_val = int(res["commitment"])
    assert 0 < commitment_val < SNARK_FIELD

    # Determinism: same fingerprint and secret yields same commitment
    res2 = generate_commitment(fingerprint=fingerprint, secret=secret)
    assert res2["commitment"] == res["commitment"]


def test_valid_zk_proof_and_verification():
    """Test generating a valid Groth16 proof and verifying it with snarkjs."""
    fingerprint = "8000000000000000"
    secret = "987654321012345"
    c_info = generate_commitment(fingerprint=fingerprint, secret=secret)

    # Generate proof
    proof_result = generate_zk_proof(
        fingerprint=c_info["fingerprint"],
        secret=c_info["secret"],
        commitment=c_info["commitment"]
    )

    assert proof_result["valid"] is True
    assert "proof" in proof_result
    assert "public_signals" in proof_result
    assert proof_result["public_signals"][0] == c_info["commitment"]

    # Security check: secret must NEVER appear in public signals or proof
    proof_str = json.dumps(proof_result["proof"])
    signals_str = json.dumps(proof_result["public_signals"])
    assert secret not in proof_str
    assert secret not in signals_str

    # Verify proof against commitment
    verify_result = verify_zk_proof(
        proof=proof_result["proof"],
        public_signals=proof_result["public_signals"],
        expected_commitment=c_info["commitment"]
    )

    assert verify_result["valid"] is True
    assert "verified" in verify_result["message"].lower()


def test_invalid_zk_proof_with_tampered_commitment():
    """Test that proof verification fails when public signals are tampered with."""
    fingerprint = "8000000000000000"
    secret = "112233445566778"
    c_info = generate_commitment(fingerprint=fingerprint, secret=secret)

    proof_result = generate_zk_proof(
        fingerprint=c_info["fingerprint"],
        secret=c_info["secret"],
        commitment=c_info["commitment"]
    )

    # Tamper with the public signal (different commitment)
    tampered_signals = ["123456789999999999999999999999999999999"]
    verify_result = verify_zk_proof(
        proof=proof_result["proof"],
        public_signals=tampered_signals,
        expected_commitment=tampered_signals[0]
    )

    assert verify_result["valid"] is False
    assert "failed" in verify_result["message"].lower()


def test_missing_commitment_for_artwork():
    """Test proving for an artwork ID that has no commitment or does not exist."""
    # Artwork does not exist
    with pytest.raises(ValueError) as exc1:
        generate_zk_proof(artwork_id="ART-NONEXISTENT")
    assert "not found" in str(exc1.value).lower()

    # Artwork exists in DB but without commitment
    save_artwork(
        artwork_id="ART-999",
        title="Uncommitted Art",
        creator="Artist X",
        sha256="abcd" * 16,
        phash="8000000000000000",
        image_path="dummy.png",
        created_at="2026-10-01T00:00:00Z",
        zk_commitment=None
    )

    with pytest.raises(ValueError) as exc2:
        generate_zk_proof(artwork_id="ART-999")
    assert "does not have a registered zk commitment" in str(exc2.value).lower()


def test_malformed_proof():
    """Test that a malformed proof dictionary is gracefully rejected without crashing."""
    malformed_proof = {"protocol": "groth16", "curve": "bn128", "pi_a": ["invalid"]}
    signals = ["16101378328974553003924745122718389088265171996901128439167074162499521246319"]

    verify_result = verify_zk_proof(
        proof=malformed_proof,
        public_signals=signals
    )

    assert verify_result["valid"] is False
    assert "failed" in verify_result["message"].lower()


@pytest.mark.asyncio
async def test_full_registration_and_zk_endpoints():
    """Test full flow: register artwork -> /zk/prove -> /zk/verify via FastAPI endpoints."""
    img_bytes = create_test_image("cyan")
    upload = UploadFile(filename="cyber_artwork.png", file=io.BytesIO(img_bytes))

    # 1. Register artwork (generates ZK commitment and stores in vault & SQLite)
    reg_response = await register_artwork(file=upload, title="Cyber Neon", creator="Satoshi Art")
    assert reg_response["status"] == "success"
    art_id = reg_response["artwork"]["id"]
    commitment = reg_response["artwork"]["zk_commitment"]
    assert commitment is not None
    assert len(commitment) > 10

    # 2. Call POST /zk/prove
    prove_req = ZKProveRequest(artwork_id=art_id)
    prove_res = await zk_prove_endpoint(prove_req)
    assert prove_res.valid is True
    assert prove_res.artwork_id == art_id
    assert prove_res.commitment == commitment
    assert "pi_a" in prove_res.proof

    # 3. Call POST /zk/verify
    verify_req = ZKVerifyRequest(
        artwork_id=art_id,
        commitment=prove_res.commitment,
        proof=prove_res.proof,
        public_signals=prove_res.public_signals
    )
    verify_res = await zk_verify_endpoint(verify_req)
    assert verify_res.valid is True
    assert verify_res.artwork_id == art_id
    assert "verified" in verify_res.message.lower()

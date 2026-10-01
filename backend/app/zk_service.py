import json
import logging
import os
import subprocess
import sys
from pathlib import Path
from typing import Any

from app.database import DATA_DIR, get_artwork_by_id

logger = logging.getLogger(__name__)

# Base paths resolved with pathlib
BASE_DIR = Path(__file__).resolve().parent.parent.parent
ZK_DIR = BASE_DIR / "zk"
ZK_BUILD_DIR = ZK_DIR / "build"
WASM_PATH = ZK_BUILD_DIR / "artwork_identity_js" / "artwork_identity.wasm"
ZKEY_PATH = ZK_BUILD_DIR / "artwork_identity_final.zkey"
VKEY_PATH = ZK_BUILD_DIR / "verification_key.json"
GENERATE_COMMITMENT_JS = ZK_DIR / "generate_commitment.js"
GENERATE_PROOF_JS = ZK_DIR / "generate_proof.js"
VERIFY_JS = ZK_DIR / "verify.js"

# Server-side private vault (NEVER stored in SQLite or sent to frontend)
VAULT_FILE = DATA_DIR / ".zk_vault.json"

# BN128 / BabyJubjub scalar field order
SNARK_FIELD = 21888242871839275222246405745257275088548364400416034343698204186575808495617


def _load_vault() -> dict[str, dict]:
    """Load server-side private secret vault."""
    if not VAULT_FILE.exists():
        return {}
    try:
        with open(VAULT_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.warning(f"Failed to read ZK vault: {e}")
        return {}


def _save_vault(vault: dict[str, dict]) -> None:
    """Save server-side private secret vault."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(VAULT_FILE, "w", encoding="utf-8") as f:
        json.dump(vault, f, indent=2)


def save_vault_secret(artwork_id: str, secret: str, fingerprint: str, commitment: str) -> None:
    """
    Store secret credentials in server vault only.
    Never stored in SQLite; never returned in public APIs.
    """
    vault = _load_vault()
    vault[artwork_id] = {
        "secret": str(secret),
        "fingerprint": str(fingerprint),
        "commitment": str(commitment),
    }
    _save_vault(vault)


def get_vault_secret(artwork_id: str) -> dict | None:
    """Retrieve secret credentials from server vault for proof generation."""
    vault = _load_vault()
    return vault.get(artwork_id)


def to_field_str(val: str | int) -> str:
    """Normalize input into a decimal string representation of a field element."""
    s = str(val).strip()
    if s.startswith("0x") or s.startswith("0X"):
        return str(int(s, 16) % SNARK_FIELD)
    if any(c in "abcdefABCDEF" for c in s):
        return str(int(s, 16) % SNARK_FIELD)
    return str(int(s) % SNARK_FIELD)


def generate_commitment(fingerprint: str, secret: str | None = None) -> dict:
    """
    Compute Poseidon(fingerprint, secret) == commitment via circomlibjs in Node.
    Returns: { "fingerprint": str, "secret": str, "commitment": str }
    """
    if not GENERATE_COMMITMENT_JS.exists():
        raise FileNotFoundError(f"generate_commitment.js not found at: {GENERATE_COMMITMENT_JS}")

    fp_arg = str(fingerprint).strip()
    if not fp_arg.startswith("0x") and not fp_arg.startswith("0X"):
        if any(c in "abcdefABCDEF" for c in fp_arg) or len(fp_arg) in (16, 64):
            fp_arg = f"0x{fp_arg}"

    cmd = ["node", str(GENERATE_COMMITMENT_JS), fp_arg]
    if secret:
        cmd.append(str(secret))

    result = subprocess.run(
        cmd,
        cwd=str(ZK_DIR),
        capture_output=True,
        text=True,
        timeout=15,
    )

    if result.returncode != 0:
        raise RuntimeError(f"Commitment generation failed: {result.stderr or result.stdout}")

    try:
        output = json.loads(result.stdout.strip())
        return output
    except json.JSONDecodeError as e:
        raise RuntimeError(f"Failed to parse commitment output JSON: {result.stdout}") from e


def generate_zk_proof(
    artwork_id: str | None = None,
    fingerprint: str | None = None,
    secret: str | None = None,
    commitment: str | None = None,
) -> dict:
    """
    Generate Groth16 zero-knowledge proof for ArtworkIdentity circuit.
    Proves: Poseidon(fingerprint, secret) == commitment
    without revealing fingerprint or secret.
    """
    if artwork_id:
        vault_entry = get_vault_secret(artwork_id)
        if not vault_entry:
            art = get_artwork_by_id(artwork_id)
            if not art:
                raise ValueError(f"Artwork '{artwork_id}' not found in database")
            if not art.get("zk_commitment"):
                raise ValueError(f"Artwork '{artwork_id}' does not have a registered ZK commitment")
            raise ValueError(f"No secret credentials found in server vault for artwork '{artwork_id}'")

        fingerprint = vault_entry["fingerprint"]
        secret = vault_entry["secret"]
        commitment = vault_entry["commitment"]

    if not fingerprint or not secret or not commitment:
        raise ValueError("Missing required circuit inputs: fingerprint, secret, and commitment are required")

    if not WASM_PATH.exists() or not ZKEY_PATH.exists():
        raise FileNotFoundError(
            "ZK circuit artifacts (WASM or zkey) not found. Run ZK setup before generating proofs."
        )

    input_payload = {
        "fingerprint": to_field_str(fingerprint),
        "secret": to_field_str(secret),
        "commitment": str(commitment),
    }

    input_json_str = json.dumps(input_payload)

    cmd = ["node", str(GENERATE_PROOF_JS), input_json_str]
    result = subprocess.run(
        cmd,
        cwd=str(ZK_DIR),
        capture_output=True,
        text=True,
        timeout=30,
    )

    if result.returncode != 0:
        raise RuntimeError(f"ZK proof generation failed: {result.stderr or result.stdout}")

    try:
        output = json.loads(result.stdout.strip())
        return {
            "valid": True,
            "artwork_id": artwork_id,
            "commitment": commitment,
            "proof": output["proof"],
            "public_signals": output["publicSignals"],
            "message": "Zero-knowledge proof generated successfully",
        }
    except json.JSONDecodeError as e:
        raise RuntimeError(f"Failed to parse proof output JSON: {result.stdout}") from e


def verify_zk_proof(
    proof: dict[str, Any],
    public_signals: list[str],
    artwork_id: str | None = None,
    expected_commitment: str | None = None,
) -> dict:
    """
    Verify Groth16 zero-knowledge proof against verification_key.json.
    Optionally verifies that public_signals[0] matches the artwork's registered commitment.
    """
    if not VKEY_PATH.exists():
        raise FileNotFoundError(f"Verification key not found at: {VKEY_PATH}")

    if not proof or not public_signals:
        return {
            "valid": False,
            "artwork_id": artwork_id,
            "message": "Zero-knowledge proof verification failed: missing proof or public signals",
        }

    commitment_in_signal = str(public_signals[0]) if len(public_signals) > 0 else ""

    if artwork_id:
        art = get_artwork_by_id(artwork_id)
        if not art:
            return {
                "valid": False,
                "artwork_id": artwork_id,
                "message": f"Artwork '{artwork_id}' not found in database",
            }
        expected_commitment = art.get("zk_commitment")
        if not expected_commitment:
            return {
                "valid": False,
                "artwork_id": artwork_id,
                "message": f"Artwork '{artwork_id}' has no registered ZK commitment",
            }

    if expected_commitment and str(expected_commitment) != commitment_in_signal:
        return {
            "valid": False,
            "artwork_id": artwork_id,
            "commitment": commitment_in_signal,
            "message": "Zero-knowledge proof verification failed: public signal does not match registered commitment",
        }

    proof_json_str = json.dumps(proof)
    public_json_str = json.dumps(public_signals)

    cmd = ["node", str(VERIFY_JS), proof_json_str, public_json_str, str(VKEY_PATH)]
    result = subprocess.run(
        cmd,
        cwd=str(ZK_DIR),
        capture_output=True,
        text=True,
        timeout=15,
    )

    if result.returncode != 0:
        return {
            "valid": False,
            "artwork_id": artwork_id,
            "commitment": commitment_in_signal,
            "message": "Zero-knowledge proof verification failed",
        }

    try:
        output = json.loads(result.stdout.strip())
        return {
            "valid": bool(output.get("valid", False)),
            "artwork_id": artwork_id,
            "commitment": commitment_in_signal,
            "message": output.get("message", "Zero-knowledge proof verified"),
        }
    except Exception:
        is_valid = result.returncode == 0
        return {
            "valid": is_valid,
            "artwork_id": artwork_id,
            "commitment": commitment_in_signal,
            "message": "Zero-knowledge proof verified" if is_valid else "Zero-knowledge proof verification failed",
        }


def get_zk_status() -> dict:
    """Return status of ZK proof system and artifacts."""
    vault = _load_vault()
    is_ready = WASM_PATH.exists() and ZKEY_PATH.exists() and VKEY_PATH.exists()

    return {
        "status": "ready" if is_ready else "uninitialized",
        "circuit": "ArtworkIdentity",
        "protocol": "Groth16",
        "curve": "bn128",
        "has_wasm": WASM_PATH.exists(),
        "has_zkey": ZKEY_PATH.exists(),
        "has_vkey": VKEY_PATH.exists(),
        "vault_records_count": len(vault),
        "wasm_path": str(WASM_PATH.as_posix()),
        "vkey_path": str(VKEY_PATH.as_posix()),
    }

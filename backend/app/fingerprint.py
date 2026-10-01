import hashlib
import io
from PIL import Image
import imagehash


def calculate_sha256(file_bytes: bytes) -> str:
    """Calculate SHA-256 cryptographic hash from raw file bytes."""
    return hashlib.sha256(file_bytes).hexdigest()


def calculate_phash(file_bytes: bytes) -> str:
    """Calculate perceptual hash (pHash) from image bytes using Pillow and ImageHash."""
    with Image.open(io.BytesIO(file_bytes)) as img:
        phash_obj = imagehash.phash(img)
        return str(phash_obj)


def compute_phash_distance(phash1_str: str, phash2_str: str) -> int:
    """Calculate Hamming distance between two hex string pHashes."""
    h1 = imagehash.hex_to_hash(phash1_str)
    h2 = imagehash.hex_to_hash(phash2_str)
    return int(h1 - h2)


def calculate_similarity_score(distance: int, max_bits: int = 64) -> float:
    """
    Convert pHash Hamming distance into a visual similarity score percentage (0.0 to 100.0).
    Note: This is a deterministic visual similarity metric, not a probability of copyright infringement.
    """
    similarity = max(0.0, (1.0 - (distance / float(max_bits))) * 100.0)
    return round(similarity, 2)

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

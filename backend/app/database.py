import sqlite3
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
UPLOADS_DIR = DATA_DIR / "uploads"
DB_PATH = DATA_DIR / "ghost_art.db"


def init_db():
    """Ensure data directories exist and initialize the SQLite database table."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS artworks (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                creator TEXT NOT NULL,
                sha256 TEXT NOT NULL,
                phash TEXT NOT NULL,
                image_path TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
        """)
        conn.commit()


def get_db_connection() -> sqlite3.Connection:
    """Return a new SQLite database connection."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def generate_artwork_id() -> str:
    """Generate sequential artwork ID (e.g. ART-001, ART-002)."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM artworks")
        count = cursor.fetchone()[0]
        return f"ART-{count + 1:03d}"


def save_artwork(artwork_id: str, title: str, creator: str, sha256: str, phash: str, image_path: str, created_at: str) -> dict:
    """Insert a new artwork record into the database."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO artworks (id, title, creator, sha256, phash, image_path, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (artwork_id, title, creator, sha256, phash, image_path, created_at)
        )
        conn.commit()

    return {
        "id": artwork_id,
        "title": title,
        "creator": creator,
        "sha256": sha256,
        "phash": phash,
        "image_path": image_path,
        "created_at": created_at
    }


def get_all_artworks() -> list[dict]:
    """Retrieve all registered artwork records from SQLite database."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, title, creator, sha256, phash, image_path, created_at FROM artworks")
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

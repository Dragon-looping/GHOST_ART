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
                created_at TEXT NOT NULL,
                zk_commitment TEXT
            );
        """)
        # Safe migration if table already existed without zk_commitment column
        cursor.execute("PRAGMA table_info(artworks)")
        columns = [row[1] for row in cursor.fetchall()]
        if "zk_commitment" not in columns:
            cursor.execute("ALTER TABLE artworks ADD COLUMN zk_commitment TEXT")
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


def save_artwork(
    artwork_id: str,
    title: str,
    creator: str,
    sha256: str,
    phash: str,
    image_path: str,
    created_at: str,
    zk_commitment: str | None = None
) -> dict:
    """Insert a new artwork record into the database."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO artworks (id, title, creator, sha256, phash, image_path, created_at, zk_commitment)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (artwork_id, title, creator, sha256, phash, image_path, created_at, zk_commitment)
        )
        conn.commit()

    return {
        "id": artwork_id,
        "title": title,
        "creator": creator,
        "sha256": sha256,
        "phash": phash,
        "image_path": image_path,
        "created_at": created_at,
        "zk_commitment": zk_commitment
    }


def get_all_artworks() -> list[dict]:
    """Retrieve all registered artwork records from SQLite database."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(artworks)")
        columns = [row[1] for row in cursor.fetchall()]
        if "zk_commitment" in columns:
            cursor.execute("SELECT id, title, creator, sha256, phash, image_path, created_at, zk_commitment FROM artworks")
        else:
            cursor.execute("SELECT id, title, creator, sha256, phash, image_path, created_at FROM artworks")
        rows = cursor.fetchall()
        return [dict(row) for row in rows]


def get_artwork_by_id(artwork_id: str) -> dict | None:
    """Retrieve a single artwork record by its ID."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM artworks WHERE id = ?", (artwork_id,))
        row = cursor.fetchone()
        return dict(row) if row else None


def update_artwork_commitment(artwork_id: str, zk_commitment: str) -> bool:
    """Update or backfill zk_commitment for an existing artwork record."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE artworks SET zk_commitment = ? WHERE id = ?",
            (zk_commitment, artwork_id)
        )
        conn.commit()
        return cursor.rowcount > 0


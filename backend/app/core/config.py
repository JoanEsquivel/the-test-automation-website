from pathlib import Path

# Static dev secret by design: this is a practice sandbox, never a production system.
JWT_SECRET = "taw-dev-secret-do-not-use-in-production"
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 24

# shared/seed is the single source of truth, also bundled into the frontend engine.
SEED_DIR = Path(__file__).resolve().parents[3] / "shared" / "seed"

PASSWORD_SALT = "taw-static-salt"

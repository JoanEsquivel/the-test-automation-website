"""TAW backend — FastAPI application factory.

No database by design: all state lives in memory, seeded from ../shared/seed/*.json.
This is the "backend mode" server of the dual-mode architecture; the normative API
contract lives in docs/02-specs/api-contract.md.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.errors import register_error_handlers
from app.routers import auth, products
from app.store.memory import MemoryStore

APP_VERSION = "1.0.0"

CORS_ORIGINS = [
    "http://localhost:5173",  # vite dev
    "http://localhost:4173",  # vite preview
]


def create_app() -> FastAPI:
    app = FastAPI(
        title="The Test Automation Website API",
        description=(
            "Practice API for the TAW project. Use these docs as your target for "
            "API-testing tools (Postman, RestAssured, requests...). State is in-memory "
            "and resets on restart."
        ),
        version=APP_VERSION,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["Content-Disposition"],
    )

    app.state.store = MemoryStore()
    register_error_handlers(app)
    app.include_router(auth.router)
    app.include_router(products.router)

    @app.get("/api/health", tags=["health"])
    def health() -> dict:
        return {"status": "ok", "mode": "backend", "version": APP_VERSION}

    return app


app = create_app()

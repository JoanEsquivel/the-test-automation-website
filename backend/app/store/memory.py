"""In-memory data store seeded from shared/seed/*.json (no database by design).

Each app instance gets its own MemoryStore, so tests are isolated and a server
restart resets the sandbox to seed state — desirable for a practice site.
"""

import copy
import itertools
import json
import secrets
from typing import Any

from app.core import config
from app.core.security import hash_password


def _load(name: str) -> Any:
    return json.loads((config.SEED_DIR / f"{name}.json").read_text())


def new_id(prefix: str) -> str:
    return f"{prefix}-{secrets.token_hex(4)}"


class MemoryStore:
    def __init__(self) -> None:
        self.categories: list[dict] = _load("categories")
        self.coupons: dict[str, dict] = {c["code"]: c for c in _load("coupons")}
        self.reviews: list[dict] = _load("reviews")

        self.users: dict[str, dict] = {}
        for raw in _load("users"):
            user = copy.deepcopy(raw)
            user["passwordHash"] = hash_password(user.pop("password"))
            self.users[user["id"]] = user

        self.products: dict[str, dict] = {}
        for raw in _load("products"):
            self.products[raw["id"]] = copy.deepcopy(raw)

        # Runtime-only collections (never seeded)
        self.carts: dict[str, dict] = {}
        self.orders: dict[str, dict] = {}
        self.wishlists: dict[str, list[dict]] = {}
        self._order_counter = itertools.count(1)

    # -- users ---------------------------------------------------------------

    def user_by_email(self, email: str) -> dict | None:
        lowered = email.lower()
        return next((u for u in self.users.values() if u["email"].lower() == lowered), None)

    # -- products ------------------------------------------------------------

    def product_rating(self, product_id: str) -> float:
        ratings = [r["rating"] for r in self.reviews if r["productId"] == product_id]
        if not ratings:
            return 0.0
        return round(sum(ratings) / len(ratings), 1)

    def product_with_rating(self, product: dict) -> dict:
        return {**product, "rating": self.product_rating(product["id"])}

    def reviews_for(self, product_id: str) -> list[dict]:
        found = [r for r in self.reviews if r["productId"] == product_id]
        return sorted(found, key=lambda r: r["createdAt"], reverse=True)

    # -- orders --------------------------------------------------------------

    def next_order_number(self) -> str:
        return f"TAW-2026-{next(self._order_counter):04d}"

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field

from app.core.errors import ApiError
from app.core.security import get_current_user
from app.schemas.product import Review
from app.store.memory import MemoryStore, new_id

router = APIRouter(prefix="/api/products/{product_id}/reviews", tags=["reviews"])


class ReviewInput(BaseModel):
    rating: int = Field(ge=1, le=5)
    title: str
    body: str


def _store(request: Request) -> MemoryStore:
    return request.app.state.store


def _require_product(store: MemoryStore, product_id: str) -> dict:
    product = store.products.get(product_id)
    if product is None:
        raise ApiError(404, "NOT_FOUND", f"Product '{product_id}' was not found.")
    return product


@router.get("", response_model=list[Review])
def list_reviews(product_id: str, request: Request) -> list[dict]:
    store = _store(request)
    _require_product(store, product_id)
    return store.reviews_for(product_id)


@router.post("", status_code=201, response_model=Review)
def create_review(
    product_id: str, body: ReviewInput, request: Request, user: dict = Depends(get_current_user)
) -> dict:
    store = _store(request)
    _require_product(store, product_id)
    review = {
        "id": new_id("rev"),
        "productId": product_id,
        "userId": user["id"],
        "authorName": user["name"],
        "rating": body.rating,
        "title": body.title,
        "body": body.body,
        "createdAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }
    store.reviews.append(review)
    return review

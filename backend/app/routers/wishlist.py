from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request, Response

from app.core.errors import ApiError
from app.core.security import get_current_user
from app.store.memory import MemoryStore

router = APIRouter(prefix="/api/wishlist", tags=["wishlist"])


def _store(request: Request) -> MemoryStore:
    return request.app.state.store


@router.get("")
def list_wishlist(request: Request, user: dict = Depends(get_current_user)) -> dict:
    store = _store(request)
    entries = store.wishlists.get(user["id"], [])
    items = []
    for entry in entries:
        product = store.products.get(entry["productId"])
        if product:
            items.append({"product": store.product_with_rating(product), "addedAt": entry["addedAt"]})
    return {"items": items}


@router.post("/{product_id}", status_code=201)
def add_to_wishlist(product_id: str, request: Request, user: dict = Depends(get_current_user)) -> dict:
    store = _store(request)
    if product_id not in store.products:
        raise ApiError(404, "NOT_FOUND", f"Product '{product_id}' was not found.")
    entries = store.wishlists.setdefault(user["id"], [])
    if any(e["productId"] == product_id for e in entries):
        raise ApiError(409, "ALREADY_IN_WISHLIST", "This product is already in your wishlist.")
    entry = {"productId": product_id, "addedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")}
    entries.append(entry)
    return entry


@router.delete("/{product_id}", status_code=204)
def remove_from_wishlist(product_id: str, request: Request, user: dict = Depends(get_current_user)) -> Response:
    store = _store(request)
    entries = store.wishlists.get(user["id"], [])
    store.wishlists[user["id"]] = [e for e in entries if e["productId"] != product_id]
    return Response(status_code=204)

from typing import Literal

from fastapi import APIRouter, Query, Request

from app.core.errors import ApiError
from app.schemas.common import Page, paginate
from app.schemas.product import Category, Product
from app.store.memory import MemoryStore

router = APIRouter(prefix="/api", tags=["catalog"])

SortKey = Literal["price-asc", "price-desc", "name-asc", "name-desc", "rating-desc", "newest"]

_SORTERS = {
    "price-asc": (lambda p: p["price"], False),
    "price-desc": (lambda p: p["price"], True),
    "name-asc": (lambda p: p["name"].lower(), False),
    "name-desc": (lambda p: p["name"].lower(), True),
    "rating-desc": (lambda p: p["rating"], True),
    "newest": (lambda p: p["createdAt"], True),
}


def _store(request: Request) -> MemoryStore:
    return request.app.state.store


@router.get("/products", response_model=Page[Product])
def list_products(
    request: Request,
    search: str = "",
    category: str = "",
    sort: SortKey = "newest",
    page: int = Query(1, ge=1),
    pageSize: int = Query(12, ge=1),
) -> dict:
    store = _store(request)
    page_size = min(pageSize, 48)

    products = [store.product_with_rating(p) for p in store.products.values()]
    if search:
        needle = search.lower()
        products = [p for p in products if needle in p["name"].lower() or needle in p["description"].lower()]
    if category:
        products = [p for p in products if p["category"] == category]

    key, reverse = _SORTERS[sort]
    products.sort(key=key, reverse=reverse)
    return paginate(products, page, page_size)


@router.get("/products/{product_id}", response_model=Product)
def get_product(product_id: str, request: Request) -> dict:
    store = _store(request)
    product = store.products.get(product_id)
    if product is None:
        raise ApiError(404, "NOT_FOUND", f"Product '{product_id}' was not found.")
    return store.product_with_rating(product)


@router.get("/categories", response_model=list[Category])
def list_categories(request: Request) -> list[dict]:
    return _store(request).categories

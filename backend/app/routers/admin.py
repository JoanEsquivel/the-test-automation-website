from collections import defaultdict
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query, Request, Response
from pydantic import BaseModel, Field

from app.core.errors import ApiError
from app.core.security import require_admin
from app.schemas.cart import Order
from app.schemas.common import Page, paginate
from app.schemas.product import Product
from app.store.memory import MemoryStore, new_id

router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(require_admin)])

STATUS_TRANSITIONS: dict[str, set[str]] = {
    "pending": {"paid", "cancelled"},
    "paid": {"shipped", "cancelled"},
    "shipped": {"delivered"},
    "delivered": set(),
    "cancelled": set(),
}


class ProductCreateInput(BaseModel):
    name: str
    description: str
    price: float = Field(ge=0)
    category: str
    tags: list[str] = []
    stock: int = Field(ge=0)
    imageEmoji: str = "📦"


class ProductUpdateInput(BaseModel):
    name: str | None = None
    description: str | None = None
    price: float | None = Field(default=None, ge=0)
    category: str | None = None
    tags: list[str] | None = None
    stock: int | None = Field(default=None, ge=0)
    imageEmoji: str | None = None


class StatusInput(BaseModel):
    status: str


def _store(request: Request) -> MemoryStore:
    return request.app.state.store


@router.get("/products", response_model=Page[Product])
def list_products(
    request: Request,
    search: str = "",
    page: int = Query(1, ge=1),
    pageSize: int = Query(12, ge=1),
) -> dict:
    store = _store(request)
    products = [store.product_with_rating(p) for p in store.products.values()]
    if search:
        needle = search.lower()
        products = [p for p in products if needle in p["name"].lower()]
    products.sort(key=lambda p: p["createdAt"], reverse=True)
    return paginate(products, page, min(pageSize, 48))


@router.post("/products", status_code=201, response_model=Product)
def create_product(body: ProductCreateInput, request: Request) -> dict:
    store = _store(request)
    product = {
        "id": new_id("prod"),
        **body.model_dump(),
        "createdAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }
    store.products[product["id"]] = product
    return store.product_with_rating(product)


@router.put("/products/{product_id}", response_model=Product)
def update_product(product_id: str, body: ProductUpdateInput, request: Request) -> dict:
    store = _store(request)
    product = store.products.get(product_id)
    if product is None:
        raise ApiError(404, "NOT_FOUND", f"Product '{product_id}' was not found.")
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    product.update(updates)
    return store.product_with_rating(product)


@router.delete("/products/{product_id}", status_code=204)
def delete_product(product_id: str, request: Request) -> Response:
    store = _store(request)
    if product_id not in store.products:
        raise ApiError(404, "NOT_FOUND", f"Product '{product_id}' was not found.")
    del store.products[product_id]
    return Response(status_code=204)


@router.get("/orders", response_model=list[Order])
def list_all_orders(request: Request, status: str = "") -> list[dict]:
    orders = list(_store(request).orders.values())
    if status:
        orders = [o for o in orders if o["status"] == status]
    return sorted(orders, key=lambda o: o["orderNumber"], reverse=True)


@router.patch("/orders/{order_id}/status", response_model=Order)
def update_order_status(order_id: str, body: StatusInput, request: Request) -> dict:
    store = _store(request)
    order = store.orders.get(order_id)
    if order is None:
        raise ApiError(404, "NOT_FOUND", f"Order '{order_id}' was not found.")
    allowed = STATUS_TRANSITIONS.get(order["status"], set())
    if body.status not in allowed:
        raise ApiError(
            400,
            "VALIDATION_ERROR",
            f"Cannot transition from '{order['status']}' to '{body.status}'. Allowed: {sorted(allowed) or 'none'}.",
        )
    order["status"] = body.status
    return order


@router.get("/stats")
def stats(request: Request) -> dict:
    store = _store(request)
    orders = [o for o in store.orders.values() if o["status"] != "cancelled"]
    revenue_by_category: dict[str, float] = defaultdict(float)
    units_by_product: dict[str, dict] = {}
    orders_by_status: dict[str, int] = defaultdict(int)

    for order in store.orders.values():
        orders_by_status[order["status"]] += 1
    for order in orders:
        for item in order["items"]:
            product = store.products.get(item["productId"])
            category = product["category"] if product else "unknown"
            revenue_by_category[category] += item["lineTotal"]
            entry = units_by_product.setdefault(
                item["productId"], {"productId": item["productId"], "name": item["name"], "unitsSold": 0}
            )
            entry["unitsSold"] += item["qty"]

    top_products = sorted(units_by_product.values(), key=lambda e: e["unitsSold"], reverse=True)[:5]
    return {
        "totalRevenue": round(sum(o["totals"]["total"] for o in orders), 2),
        "orderCount": len(orders),
        "ordersByStatus": dict(orders_by_status),
        "revenueByCategory": [
            {"category": category, "revenue": round(revenue, 2)}
            for category, revenue in sorted(revenue_by_category.items())
        ],
        "topProducts": top_products,
    }

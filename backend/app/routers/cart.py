from fastapi import APIRouter, Depends, Request

from app.core.errors import ApiError
from app.core.security import get_optional_user
from app.schemas.cart import AddItemInput, Cart, CouponInput, UpdateQtyInput, ValidateCouponInput
from app.services.commerce import coupon_discount, refresh_cart, validate_coupon
from app.store.memory import MemoryStore, new_id

router = APIRouter(prefix="/api", tags=["cart"])


def _store(request: Request) -> MemoryStore:
    return request.app.state.store


def blank_cart(cart_id: str, owner_user_id: str | None = None) -> dict:
    return {
        "id": cart_id,
        "ownerUserId": owner_user_id,
        "items": [],
        "couponCode": None,
        "totals": {"subtotal": 0.0, "discount": 0.0, "shipping": 0.0, "tax": 0.0, "total": 0.0},
    }


def user_cart(store: MemoryStore, user_id: str) -> dict:
    cart_id = store.user_carts.get(user_id)
    if cart_id is None:
        cart_id = new_id("cart")
        store.carts[cart_id] = blank_cart(cart_id, user_id)
        store.user_carts[user_id] = cart_id
    return store.carts[cart_id]


def get_cart(request: Request, user: dict | None = Depends(get_optional_user)) -> dict:
    """Resolve cart identity: Bearer token first, then X-Cart-Id header."""
    store = _store(request)
    if user is not None:
        return user_cart(store, user["id"])
    cart_id = request.headers.get("X-Cart-Id")
    if cart_id and cart_id in store.carts:
        return store.carts[cart_id]
    raise ApiError(401, "UNAUTHORIZED", "No cart identity. Send a Bearer token or an X-Cart-Id header.")


@router.post("/cart", status_code=201)
def create_cart(request: Request, user: dict | None = Depends(get_optional_user)) -> dict:
    store = _store(request)
    if user is not None:
        return {"cartId": user_cart(store, user["id"])["id"]}
    cart_id = new_id("cart")
    store.carts[cart_id] = blank_cart(cart_id)
    return {"cartId": cart_id}


@router.get("/cart", response_model=Cart)
def read_cart(cart: dict = Depends(get_cart)) -> dict:
    return cart


@router.post("/cart/items", status_code=201, response_model=Cart)
def add_item(body: AddItemInput, request: Request, cart: dict = Depends(get_cart)) -> dict:
    store = _store(request)
    product = store.products.get(body.productId)
    if product is None:
        raise ApiError(404, "NOT_FOUND", f"Product '{body.productId}' was not found.")
    existing = next((i for i in cart["items"] if i["productId"] == body.productId), None)
    new_qty = (existing["qty"] if existing else 0) + body.qty
    if new_qty > product["stock"]:
        raise ApiError(
            400, "OUT_OF_STOCK", f"Only {product['stock']} unit(s) of '{product['name']}' are in stock."
        )
    if existing:
        existing["qty"] = new_qty
        existing["lineTotal"] = round(existing["unitPrice"] * new_qty, 2)
    else:
        cart["items"].append(
            {
                "productId": product["id"],
                "name": product["name"],
                "unitPrice": product["price"],
                "qty": body.qty,
                "lineTotal": round(product["price"] * body.qty, 2),
            }
        )
    return refresh_cart(store, cart)


@router.patch("/cart/items/{product_id}", response_model=Cart)
def update_item(product_id: str, body: UpdateQtyInput, request: Request, cart: dict = Depends(get_cart)) -> dict:
    store = _store(request)
    item = next((i for i in cart["items"] if i["productId"] == product_id), None)
    if item is None:
        raise ApiError(404, "NOT_FOUND", f"Product '{product_id}' is not in the cart.")
    product = store.products.get(product_id)
    if product and body.qty > product["stock"]:
        raise ApiError(400, "OUT_OF_STOCK", f"Only {product['stock']} unit(s) in stock.")
    item["qty"] = body.qty
    item["lineTotal"] = round(item["unitPrice"] * body.qty, 2)
    return refresh_cart(store, cart)


@router.delete("/cart/items/{product_id}", response_model=Cart)
def remove_item(product_id: str, request: Request, cart: dict = Depends(get_cart)) -> dict:
    cart["items"] = [i for i in cart["items"] if i["productId"] != product_id]
    return refresh_cart(_store(request), cart)


@router.post("/cart/coupon", response_model=Cart)
def apply_coupon(body: CouponInput, request: Request, cart: dict = Depends(get_cart)) -> dict:
    store = _store(request)
    subtotal = sum(i["lineTotal"] for i in cart["items"])
    validate_coupon(store, body.code, subtotal)
    cart["couponCode"] = body.code
    return refresh_cart(store, cart)


@router.delete("/cart/coupon", response_model=Cart)
def remove_coupon(request: Request, cart: dict = Depends(get_cart)) -> dict:
    cart["couponCode"] = None
    return refresh_cart(_store(request), cart)


@router.post("/coupons/validate", tags=["coupons"])
def validate_coupon_endpoint(body: ValidateCouponInput, request: Request) -> dict:
    coupon = validate_coupon(_store(request), body.code, body.subtotal)
    return {
        "valid": True,
        "type": coupon["type"],
        "value": coupon["value"],
        "discount": coupon_discount(coupon, body.subtotal),
    }

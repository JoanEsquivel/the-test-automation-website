from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request

from app.core.errors import ApiError
from app.core.security import get_current_user
from app.routers.cart import user_cart
from app.schemas.cart import CheckoutInput, Order, PaymentInput
from app.services.commerce import luhn_valid, refresh_cart
from app.store.memory import MemoryStore, new_id

router = APIRouter(prefix="/api/orders", tags=["orders"])


def _store(request: Request) -> MemoryStore:
    return request.app.state.store


def _validate_payment(payment: PaymentInput) -> str:
    digits = payment.cardNumber.replace(" ", "")
    if not digits.isdigit() or not 13 <= len(digits) <= 19:
        raise ApiError(400, "VALIDATION_ERROR", "Card number must be 13-19 digits.")
    if digits.endswith("0000"):
        raise ApiError(400, "PAYMENT_DECLINED", "The card was declined (test decline card).")
    if not luhn_valid(digits):
        raise ApiError(400, "VALIDATION_ERROR", "Card number failed validation (not Luhn-valid).")
    if not payment.cvc.isdigit() or not 3 <= len(payment.cvc) <= 4:
        raise ApiError(400, "VALIDATION_ERROR", "CVC must be 3 or 4 digits.")
    try:
        month, year = payment.expiry.split("/")
        expiry = datetime(2000 + int(year), int(month), 1, tzinfo=timezone.utc)
    except (ValueError, IndexError) as exc:
        raise ApiError(400, "VALIDATION_ERROR", "Expiry must be in MM/YY format.") from exc
    now = datetime.now(timezone.utc)
    if expiry.replace(day=28) < now.replace(day=1):
        raise ApiError(400, "VALIDATION_ERROR", "The card has expired.")
    return digits[-4:]


@router.post("", status_code=201, response_model=Order)
def checkout(body: CheckoutInput, request: Request, user: dict = Depends(get_current_user)) -> dict:
    store = _store(request)
    cart = user_cart(store, user["id"])
    if not cart["items"]:
        raise ApiError(400, "EMPTY_CART", "Your cart is empty. Add items before checking out.")

    # stock re-check before payment
    for item in cart["items"]:
        product = store.products.get(item["productId"])
        if product is None or item["qty"] > product["stock"]:
            raise ApiError(400, "OUT_OF_STOCK", f"'{item['name']}' no longer has enough stock.")

    last4 = _validate_payment(body.payment)
    refresh_cart(store, cart)

    order = {
        "id": new_id("order"),
        "orderNumber": store.next_order_number(),
        "userId": user["id"],
        "items": [dict(i) for i in cart["items"]],
        "shippingAddress": body.shippingAddress.model_dump(),
        "paymentMethod": {"type": "card", "last4": last4},
        "status": "paid",
        "totals": dict(cart["totals"]),
        "createdAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }
    store.orders[order["id"]] = order

    for item in cart["items"]:
        store.products[item["productId"]]["stock"] -= item["qty"]
    cart["items"] = []
    cart["couponCode"] = None
    refresh_cart(store, cart)
    return order


@router.get("", response_model=list[Order])
def list_orders(request: Request, user: dict = Depends(get_current_user)) -> list[dict]:
    own = [o for o in _store(request).orders.values() if o["userId"] == user["id"]]
    return sorted(own, key=lambda o: o["orderNumber"], reverse=True)


@router.get("/{order_id}", response_model=Order)
def get_order(order_id: str, request: Request, user: dict = Depends(get_current_user)) -> dict:
    order = _store(request).orders.get(order_id)
    if order is None or (order["userId"] != user["id"] and user["role"] != "admin"):
        raise ApiError(404, "NOT_FOUND", f"Order '{order_id}' was not found.")
    return order

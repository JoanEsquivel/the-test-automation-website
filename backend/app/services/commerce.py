"""Shared commerce logic: totals math and coupon validation.

The math here is NORMATIVE (docs/02-specs/api-contract.md) and is mirrored
line-for-line by the browser engine in frontend/src/engine/.
"""

from datetime import datetime, timezone

from app.core.errors import ApiError
from app.store.memory import MemoryStore

FREE_SHIPPING_THRESHOLD = 50.0
SHIPPING_FLAT = 4.99
TAX_RATE = 0.08


def round2(value: float) -> float:
    return round(value + 1e-9, 2)


def coupon_discount(coupon: dict, subtotal: float) -> float:
    if coupon["type"] == "percent":
        return round2(subtotal * coupon["value"] / 100)
    return round2(min(coupon["value"], subtotal))


def validate_coupon(store: MemoryStore, code: str, subtotal: float) -> dict:
    coupon = store.coupons.get(code)
    if coupon is None or not coupon["active"]:
        raise ApiError(400, "COUPON_INVALID", f"Coupon '{code}' is not valid.")
    expires = datetime.fromisoformat(coupon["expiresAt"].replace("Z", "+00:00"))
    if expires < datetime.now(timezone.utc):
        raise ApiError(400, "COUPON_EXPIRED", f"Coupon '{code}' has expired.")
    if subtotal < coupon["minSubtotal"]:
        raise ApiError(
            400,
            "COUPON_MIN_SUBTOTAL",
            f"Coupon '{code}' requires a subtotal of at least ${coupon['minSubtotal']:.2f}.",
        )
    return coupon


def compute_totals(store: MemoryStore, items: list[dict], coupon_code: str | None) -> dict:
    subtotal = round2(sum(i["lineTotal"] for i in items))
    discount = 0.0
    if coupon_code and items:
        coupon = store.coupons.get(coupon_code)
        if coupon:
            discount = coupon_discount(coupon, subtotal)
    discounted = round2(subtotal - discount)
    if not items:
        shipping = 0.0
    else:
        shipping = 0.0 if discounted >= FREE_SHIPPING_THRESHOLD else SHIPPING_FLAT
    tax = round2(discounted * TAX_RATE)
    total = round2(discounted + shipping + tax)
    return {"subtotal": subtotal, "discount": discount, "shipping": shipping, "tax": tax, "total": total}


def refresh_cart(store: MemoryStore, cart: dict) -> dict:
    cart["totals"] = compute_totals(store, cart["items"], cart["couponCode"])
    return cart


def luhn_valid(digits: str) -> bool:
    total = 0
    for index, char in enumerate(reversed(digits)):
        digit = int(char)
        if index % 2 == 1:
            digit *= 2
            if digit > 9:
                digit -= 9
        total += digit
    return total % 10 == 0

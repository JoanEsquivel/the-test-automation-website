from pydantic import BaseModel, Field

from app.schemas.auth import AddressInput


class CartItem(BaseModel):
    productId: str
    name: str
    unitPrice: float
    qty: int
    lineTotal: float


class Totals(BaseModel):
    subtotal: float
    discount: float
    shipping: float
    tax: float
    total: float


class Cart(BaseModel):
    id: str
    items: list[CartItem]
    couponCode: str | None
    totals: Totals


class AddItemInput(BaseModel):
    productId: str
    qty: int = Field(ge=1, le=99)


class UpdateQtyInput(BaseModel):
    qty: int = Field(ge=1, le=99)


class CouponInput(BaseModel):
    code: str


class ValidateCouponInput(BaseModel):
    code: str
    subtotal: float


class PaymentInput(BaseModel):
    cardNumber: str
    expiry: str
    cvc: str
    cardHolder: str


class CheckoutInput(BaseModel):
    shippingAddress: AddressInput
    payment: PaymentInput


class Order(BaseModel):
    id: str
    orderNumber: str
    userId: str
    items: list[CartItem]
    shippingAddress: AddressInput
    paymentMethod: dict
    status: str
    totals: Totals
    createdAt: str

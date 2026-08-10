"""Acceptance tests for Orders/Checkout — written FIRST from docs/02-specs/api-contract.md."""

from fastapi.testclient import TestClient

from tests.conftest import login

SHIPPING_ADDRESS = {
    "label": "Home",
    "fullName": "Casey Customer",
    "street": "742 Evergreen Terrace",
    "city": "Springfield",
    "zip": "49007",
    "country": "United States",
    "isDefault": True,
}

GOOD_PAYMENT = {"cardNumber": "4111 1111 1111 1111", "expiry": "12/29", "cvc": "123", "cardHolder": "Casey Customer"}


def fill_cart(client: TestClient, headers: dict, product_id: str = "prod-pulse-earbuds", qty: int = 1) -> None:
    response = client.post("/api/cart/items", json={"productId": product_id, "qty": qty}, headers=headers)
    assert response.status_code == 201, response.text


def checkout(client: TestClient, headers: dict, payment: dict = GOOD_PAYMENT):
    return client.post(
        "/api/orders",
        json={"shippingAddress": SHIPPING_ADDRESS, "payment": payment},
        headers=headers,
    )


class TestCheckout:
    def test_requires_auth(self, client: TestClient) -> None:
        assert checkout(client, {}).status_code == 401

    def test_empty_cart_rejected(self, client: TestClient) -> None:
        headers = login(client)
        response = checkout(client, headers)
        assert response.status_code == 400
        assert response.json()["error"]["code"] == "EMPTY_CART"

    def test_successful_checkout(self, client: TestClient) -> None:
        headers = login(client)
        fill_cart(client, headers)
        response = checkout(client, headers)
        assert response.status_code == 201, response.text
        order = response.json()
        assert order["orderNumber"] == "TAW-2026-0001"
        assert order["status"] == "paid"
        assert order["paymentMethod"] == {"type": "card", "last4": "1111"}
        assert order["totals"]["total"] == 96.66
        # cart emptied
        assert client.get("/api/cart", headers=headers).json()["items"] == []
        # stock decremented (seed 60 -> 59)
        assert client.get("/api/products/prod-pulse-earbuds").json()["stock"] == 59

    def test_order_numbers_are_sequential(self, client: TestClient) -> None:
        headers = login(client)
        fill_cart(client, headers)
        checkout(client, headers)
        fill_cart(client, headers, "prod-cable-clip")
        second = checkout(client, headers).json()
        assert second["orderNumber"] == "TAW-2026-0002"

    def test_declined_card(self, client: TestClient) -> None:
        headers = login(client)
        fill_cart(client, headers)
        response = checkout(client, headers, {**GOOD_PAYMENT, "cardNumber": "4000 0000 0000 0000"})
        assert response.status_code == 400
        assert response.json()["error"]["code"] == "PAYMENT_DECLINED"
        # cart NOT emptied on failure
        assert len(client.get("/api/cart", headers=headers).json()["items"]) == 1

    def test_non_luhn_card_rejected(self, client: TestClient) -> None:
        headers = login(client)
        fill_cart(client, headers)
        response = checkout(client, headers, {**GOOD_PAYMENT, "cardNumber": "1234 5678 1234 5678"})
        assert response.status_code == 400
        assert response.json()["error"]["code"] == "VALIDATION_ERROR"

    def test_expired_card_rejected(self, client: TestClient) -> None:
        headers = login(client)
        fill_cart(client, headers)
        response = checkout(client, headers, {**GOOD_PAYMENT, "expiry": "01/20"})
        assert response.status_code == 400

    def test_coupon_snapshot_in_order(self, client: TestClient) -> None:
        headers = login(client)
        fill_cart(client, headers)
        client.post("/api/cart/coupon", json={"code": "WELCOME10"}, headers=headers)
        order = checkout(client, headers).json()
        assert order["totals"]["discount"] == 8.95
        assert order["totals"]["total"] == 86.99


class TestOrderHistory:
    def test_list_own_orders_newest_first(self, client: TestClient) -> None:
        headers = login(client)
        fill_cart(client, headers)
        checkout(client, headers)
        fill_cart(client, headers, "prod-cable-clip")
        checkout(client, headers)
        orders = client.get("/api/orders", headers=headers).json()
        assert len(orders) == 2
        assert orders[0]["orderNumber"] == "TAW-2026-0002"

    def test_detail_of_own_order(self, client: TestClient) -> None:
        headers = login(client)
        fill_cart(client, headers)
        order_id = checkout(client, headers).json()["id"]
        detail = client.get(f"/api/orders/{order_id}", headers=headers)
        assert detail.status_code == 200
        assert detail.json()["items"][0]["productId"] == "prod-pulse-earbuds"

    def test_cannot_read_another_users_order(self, client: TestClient) -> None:
        customer = login(client)
        fill_cart(client, customer)
        order_id = checkout(client, customer).json()["id"]
        other = client.post(
            "/api/auth/register",
            json={"email": "other@example.com", "password": "Other1234", "name": "Other"},
        ).json()
        other_headers = {"Authorization": f"Bearer {other['token']}"}
        assert client.get(f"/api/orders/{order_id}", headers=other_headers).status_code == 404

    def test_admin_can_read_any_order(self, client: TestClient) -> None:
        customer = login(client)
        fill_cart(client, customer)
        order_id = checkout(client, customer).json()["id"]
        admin = login(client, "admin@example.com", "Admin123!")
        assert client.get(f"/api/orders/{order_id}", headers=admin).status_code == 200

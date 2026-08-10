"""Acceptance tests for the Cart area — written FIRST from docs/02-specs/api-contract.md."""

from fastapi.testclient import TestClient

from tests.conftest import login


def make_guest_cart(client: TestClient) -> dict:
    response = client.post("/api/cart")
    assert response.status_code == 201
    return {"X-Cart-Id": response.json()["cartId"]}


class TestGuestCart:
    def test_create_guest_cart(self, client: TestClient) -> None:
        response = client.post("/api/cart")
        assert response.status_code == 201
        assert response.json()["cartId"].startswith("cart-")

    def test_get_cart_empty(self, client: TestClient) -> None:
        headers = make_guest_cart(client)
        cart = client.get("/api/cart", headers=headers).json()
        assert cart["items"] == []
        assert cart["totals"]["total"] == 0

    def test_add_item(self, client: TestClient) -> None:
        headers = make_guest_cart(client)
        response = client.post(
            "/api/cart/items", json={"productId": "prod-pulse-earbuds", "qty": 2}, headers=headers
        )
        assert response.status_code == 201
        cart = response.json()
        assert cart["items"][0]["productId"] == "prod-pulse-earbuds"
        assert cart["items"][0]["qty"] == 2
        assert cart["items"][0]["lineTotal"] == 179.0

    def test_add_same_item_increments(self, client: TestClient) -> None:
        headers = make_guest_cart(client)
        client.post("/api/cart/items", json={"productId": "prod-cable-clip", "qty": 1}, headers=headers)
        cart = client.post(
            "/api/cart/items", json={"productId": "prod-cable-clip", "qty": 3}, headers=headers
        ).json()
        assert len(cart["items"]) == 1
        assert cart["items"][0]["qty"] == 4

    def test_out_of_stock_rejected(self, client: TestClient) -> None:
        headers = make_guest_cart(client)
        response = client.post(
            "/api/cart/items", json={"productId": "prod-studio-mic", "qty": 1}, headers=headers
        )
        assert response.status_code == 400
        assert response.json()["error"]["code"] == "OUT_OF_STOCK"

    def test_qty_exceeding_stock_rejected(self, client: TestClient) -> None:
        headers = make_guest_cart(client)
        response = client.post(
            "/api/cart/items", json={"productId": "prod-quantum-headset", "qty": 6}, headers=headers
        )  # stock is 5
        assert response.status_code == 400
        assert response.json()["error"]["code"] == "OUT_OF_STOCK"

    def test_update_qty(self, client: TestClient) -> None:
        headers = make_guest_cart(client)
        client.post("/api/cart/items", json={"productId": "prod-cable-clip", "qty": 1}, headers=headers)
        cart = client.patch("/api/cart/items/prod-cable-clip", json={"qty": 5}, headers=headers).json()
        assert cart["items"][0]["qty"] == 5

    def test_update_qty_zero_rejected(self, client: TestClient) -> None:
        headers = make_guest_cart(client)
        client.post("/api/cart/items", json={"productId": "prod-cable-clip", "qty": 1}, headers=headers)
        response = client.patch("/api/cart/items/prod-cable-clip", json={"qty": 0}, headers=headers)
        assert response.status_code == 400

    def test_remove_item(self, client: TestClient) -> None:
        headers = make_guest_cart(client)
        client.post("/api/cart/items", json={"productId": "prod-cable-clip", "qty": 1}, headers=headers)
        cart = client.delete("/api/cart/items/prod-cable-clip", headers=headers).json()
        assert cart["items"] == []

    def test_no_identity_gets_fresh_user_cart_requires_something(self, client: TestClient) -> None:
        # Without a token or X-Cart-Id there is no cart identity
        response = client.get("/api/cart")
        assert response.status_code == 401


class TestTotalsMath:
    """Normative math from the API contract."""

    def test_small_cart_pays_shipping(self, client: TestClient) -> None:
        headers = make_guest_cart(client)
        totals = client.post(
            "/api/cart/items", json={"productId": "prod-cable-clip", "qty": 1}, headers=headers
        ).json()["totals"]
        assert totals["subtotal"] == 0.99
        assert totals["shipping"] == 4.99
        assert totals["tax"] == 0.08
        assert totals["total"] == 6.06

    def test_free_shipping_at_50(self, client: TestClient) -> None:
        headers = make_guest_cart(client)
        totals = client.post(
            "/api/cart/items", json={"productId": "prod-pulse-earbuds", "qty": 1}, headers=headers
        ).json()["totals"]
        assert totals["subtotal"] == 89.5
        assert totals["shipping"] == 0
        assert totals["tax"] == 7.16
        assert totals["total"] == 96.66

    def test_percent_coupon_applies(self, client: TestClient) -> None:
        headers = make_guest_cart(client)
        client.post("/api/cart/items", json={"productId": "prod-pulse-earbuds", "qty": 1}, headers=headers)
        cart = client.post("/api/cart/coupon", json={"code": "WELCOME10"}, headers=headers).json()
        assert cart["couponCode"] == "WELCOME10"
        assert cart["totals"]["discount"] == 8.95
        assert cart["totals"]["total"] == 86.99


class TestCoupons:
    def test_coupon_min_subtotal(self, client: TestClient) -> None:
        headers = make_guest_cart(client)
        client.post("/api/cart/items", json={"productId": "prod-cable-clip", "qty": 1}, headers=headers)
        response = client.post("/api/cart/coupon", json={"code": "SAVE20"}, headers=headers)
        assert response.status_code == 400
        assert response.json()["error"]["code"] == "COUPON_MIN_SUBTOTAL"

    def test_coupon_expired(self, client: TestClient) -> None:
        headers = make_guest_cart(client)
        client.post("/api/cart/items", json={"productId": "prod-cable-clip", "qty": 1}, headers=headers)
        response = client.post("/api/cart/coupon", json={"code": "EXPIRED50"}, headers=headers)
        assert response.status_code == 400
        assert response.json()["error"]["code"] == "COUPON_EXPIRED"

    def test_coupon_unknown_or_disabled(self, client: TestClient) -> None:
        headers = make_guest_cart(client)
        client.post("/api/cart/items", json={"productId": "prod-cable-clip", "qty": 1}, headers=headers)
        for code in ("NOPE", "DISABLED5"):
            response = client.post("/api/cart/coupon", json={"code": code}, headers=headers)
            assert response.status_code == 400
            assert response.json()["error"]["code"] == "COUPON_INVALID"

    def test_remove_coupon(self, client: TestClient) -> None:
        headers = make_guest_cart(client)
        client.post("/api/cart/items", json={"productId": "prod-pulse-earbuds", "qty": 1}, headers=headers)
        client.post("/api/cart/coupon", json={"code": "WELCOME10"}, headers=headers)
        cart = client.delete("/api/cart/coupon", headers=headers).json()
        assert cart["couponCode"] is None
        assert cart["totals"]["discount"] == 0

    def test_validate_endpoint(self, client: TestClient) -> None:
        ok = client.post("/api/coupons/validate", json={"code": "WELCOME10", "subtotal": 100})
        assert ok.status_code == 200
        assert ok.json() == {"valid": True, "type": "percent", "value": 10, "discount": 10.0}
        bad = client.post("/api/coupons/validate", json={"code": "SAVE20", "subtotal": 50})
        assert bad.status_code == 400


class TestCartMergeOnLogin:
    def test_guest_cart_merges_into_user_cart(self, client: TestClient) -> None:
        guest = make_guest_cart(client)
        client.post("/api/cart/items", json={"productId": "prod-cable-clip", "qty": 2}, headers=guest)
        # login sending the guest cart id
        response = client.post(
            "/api/auth/login",
            json={"email": "customer@example.com", "password": "Password123!"},
            headers=guest,
        )
        token_headers = {"Authorization": f"Bearer {response.json()['token']}"}
        cart = client.get("/api/cart", headers=token_headers).json()
        assert any(i["productId"] == "prod-cable-clip" and i["qty"] == 2 for i in cart["items"])

    def test_user_cart_via_token_only(self, client: TestClient) -> None:
        headers = login(client)
        cart = client.get("/api/cart", headers=headers).json()
        assert cart["items"] == []

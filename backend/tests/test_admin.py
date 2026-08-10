"""Acceptance tests for the Admin area — role-guarded CRUD, orders and stats."""

from fastapi.testclient import TestClient

from tests.conftest import login
from tests.test_orders import GOOD_PAYMENT, SHIPPING_ADDRESS, checkout, fill_cart

NEW_PRODUCT = {
    "name": "Test Gadget",
    "description": "Created by the admin test suite.",
    "price": 42.0,
    "category": "accessories",
    "tags": ["test"],
    "stock": 10,
    "imageEmoji": "🧪",
}


class TestRoleGuard:
    def test_anonymous_401(self, client: TestClient) -> None:
        assert client.get("/api/admin/products").status_code == 401

    def test_customer_403(self, client: TestClient, customer_headers: dict) -> None:
        response = client.get("/api/admin/products", headers=customer_headers)
        assert response.status_code == 403
        assert response.json()["error"]["code"] == "FORBIDDEN"


class TestAdminProducts:
    def test_list_paginated(self, client: TestClient, admin_headers: dict) -> None:
        body = client.get("/api/admin/products", headers=admin_headers).json()
        assert body["total"] == 24
        assert body["pageSize"] == 12

    def test_search(self, client: TestClient, admin_headers: dict) -> None:
        body = client.get("/api/admin/products?search=aurora", headers=admin_headers).json()
        assert body["total"] == 1

    def test_create_product(self, client: TestClient, admin_headers: dict) -> None:
        response = client.post("/api/admin/products", json=NEW_PRODUCT, headers=admin_headers)
        assert response.status_code == 201
        product = response.json()
        assert product["id"].startswith("prod-")
        assert product["rating"] == 0
        # appears in the public catalog
        assert client.get(f"/api/products/{product['id']}").status_code == 200

    def test_update_product(self, client: TestClient, admin_headers: dict) -> None:
        response = client.put(
            "/api/admin/products/prod-cable-clip", json={"price": 1.49, "stock": 400}, headers=admin_headers
        )
        assert response.status_code == 200
        assert response.json()["price"] == 1.49
        assert client.get("/api/products/prod-cable-clip").json()["stock"] == 400

    def test_update_unknown_404(self, client: TestClient, admin_headers: dict) -> None:
        assert client.put("/api/admin/products/prod-nope", json={"price": 1}, headers=admin_headers).status_code == 404

    def test_delete_product(self, client: TestClient, admin_headers: dict) -> None:
        assert client.delete("/api/admin/products/prod-cable-clip", headers=admin_headers).status_code == 204
        assert client.get("/api/products/prod-cable-clip").status_code == 404


class TestAdminOrders:
    def _place_order(self, client: TestClient) -> str:
        headers = login(client)
        fill_cart(client, headers)
        return checkout(client, headers).json()["id"]

    def test_list_all_orders(self, client: TestClient) -> None:
        self._place_order(client)
        admin = login(client, "admin@example.com", "Admin123!")
        orders = client.get("/api/admin/orders", headers=admin).json()
        assert len(orders) == 1

    def test_filter_by_status(self, client: TestClient) -> None:
        self._place_order(client)
        admin = login(client, "admin@example.com", "Admin123!")
        assert len(client.get("/api/admin/orders?status=paid", headers=admin).json()) == 1
        assert client.get("/api/admin/orders?status=shipped", headers=admin).json() == []

    def test_valid_status_transition(self, client: TestClient) -> None:
        order_id = self._place_order(client)
        admin = login(client, "admin@example.com", "Admin123!")
        response = client.patch(f"/api/admin/orders/{order_id}/status", json={"status": "shipped"}, headers=admin)
        assert response.status_code == 200
        assert response.json()["status"] == "shipped"

    def test_invalid_status_transition_rejected(self, client: TestClient) -> None:
        order_id = self._place_order(client)
        admin = login(client, "admin@example.com", "Admin123!")
        response = client.patch(f"/api/admin/orders/{order_id}/status", json={"status": "delivered"}, headers=admin)
        assert response.status_code == 400  # paid -> delivered skips shipped

    def test_cancel_from_paid(self, client: TestClient) -> None:
        order_id = self._place_order(client)
        admin = login(client, "admin@example.com", "Admin123!")
        response = client.patch(f"/api/admin/orders/{order_id}/status", json={"status": "cancelled"}, headers=admin)
        assert response.status_code == 200


class TestAdminStats:
    def test_stats_shape_and_math(self, client: TestClient) -> None:
        headers = login(client)
        fill_cart(client, headers)  # pulse earbuds 89.50 -> total 96.66
        checkout(client, headers)
        admin = login(client, "admin@example.com", "Admin123!")
        stats = client.get("/api/admin/stats", headers=admin).json()
        assert stats["orderCount"] == 1
        assert stats["totalRevenue"] == 96.66
        assert stats["ordersByStatus"]["paid"] == 1
        audio_revenue = next(r for r in stats["revenueByCategory"] if r["category"] == "audio")
        assert audio_revenue["revenue"] > 0
        assert stats["topProducts"][0]["productId"] == "prod-pulse-earbuds"
        assert stats["topProducts"][0]["unitsSold"] == 1

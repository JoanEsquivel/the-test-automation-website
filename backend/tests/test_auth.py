"""Acceptance tests for the Auth area — written FIRST from docs/02-specs/api-contract.md."""

from fastapi.testclient import TestClient

from tests.conftest import login


class TestRegister:
    def test_register_returns_token_and_user(self, client: TestClient) -> None:
        response = client.post(
            "/api/auth/register",
            json={"email": "new@example.com", "password": "Secret123", "name": "New User"},
        )
        assert response.status_code == 201
        body = response.json()
        assert body["token"]
        assert body["user"]["email"] == "new@example.com"
        assert body["user"]["role"] == "customer"
        assert "password" not in body["user"]

    def test_register_duplicate_email_conflict(self, client: TestClient) -> None:
        response = client.post(
            "/api/auth/register",
            json={"email": "customer@example.com", "password": "Secret123", "name": "Dup"},
        )
        assert response.status_code == 409
        assert response.json()["error"]["code"] == "EMAIL_TAKEN"

    def test_register_weak_password_rejected(self, client: TestClient) -> None:
        # < 8 chars and no digit are both invalid
        for bad in ("short1", "longbutnodigits"):
            response = client.post(
                "/api/auth/register",
                json={"email": "weak@example.com", "password": bad, "name": "Weak"},
            )
            assert response.status_code == 400
            assert response.json()["error"]["code"] == "VALIDATION_ERROR"


class TestLogin:
    def test_login_seed_customer(self, client: TestClient) -> None:
        response = client.post(
            "/api/auth/login",
            json={"email": "customer@example.com", "password": "Password123!"},
        )
        assert response.status_code == 200
        body = response.json()
        assert body["token"].count(".") == 2  # JWT shape
        assert body["user"]["id"] == "user-customer"
        assert len(body["user"]["addresses"]) == 2

    def test_login_wrong_password(self, client: TestClient) -> None:
        response = client.post(
            "/api/auth/login",
            json={"email": "customer@example.com", "password": "nope"},
        )
        assert response.status_code == 401
        assert response.json()["error"]["code"] == "INVALID_CREDENTIALS"

    def test_login_unknown_email(self, client: TestClient) -> None:
        response = client.post(
            "/api/auth/login",
            json={"email": "ghost@example.com", "password": "Password123!"},
        )
        assert response.status_code == 401


class TestMe:
    def test_me_requires_token(self, client: TestClient) -> None:
        response = client.get("/api/auth/me")
        assert response.status_code == 401
        assert response.json()["error"]["code"] == "UNAUTHORIZED"

    def test_me_returns_profile(self, client: TestClient, customer_headers: dict) -> None:
        response = client.get("/api/auth/me", headers=customer_headers)
        assert response.status_code == 200
        assert response.json()["email"] == "customer@example.com"

    def test_me_rejects_garbage_token(self, client: TestClient) -> None:
        response = client.get("/api/auth/me", headers={"Authorization": "Bearer garbage"})
        assert response.status_code == 401

    def test_update_name(self, client: TestClient, customer_headers: dict) -> None:
        response = client.put("/api/auth/me", json={"name": "Renamed"}, headers=customer_headers)
        assert response.status_code == 200
        assert response.json()["name"] == "Renamed"

    def test_logout(self, client: TestClient, customer_headers: dict) -> None:
        response = client.post("/api/auth/logout", headers=customer_headers)
        assert response.status_code == 204


class TestAddresses:
    NEW_ADDRESS = {
        "label": "Cabin",
        "fullName": "Casey Customer",
        "street": "9 Lake Rd",
        "city": "Tahoe",
        "zip": "96150",
        "country": "United States",
        "isDefault": False,
    }

    def test_add_address(self, client: TestClient, customer_headers: dict) -> None:
        response = client.post("/api/auth/me/addresses", json=self.NEW_ADDRESS, headers=customer_headers)
        assert response.status_code == 201
        assert response.json()["id"]
        me = client.get("/api/auth/me", headers=customer_headers).json()
        assert len(me["addresses"]) == 3

    def test_update_address_and_default_flag(self, client: TestClient, customer_headers: dict) -> None:
        created = client.post("/api/auth/me/addresses", json=self.NEW_ADDRESS, headers=customer_headers).json()
        response = client.put(
            f"/api/auth/me/addresses/{created['id']}",
            json={**self.NEW_ADDRESS, "label": "Lake house", "isDefault": True},
            headers=customer_headers,
        )
        assert response.status_code == 200
        assert response.json()["label"] == "Lake house"
        me = client.get("/api/auth/me", headers=customer_headers).json()
        defaults = [a for a in me["addresses"] if a["isDefault"]]
        assert len(defaults) == 1  # setting a new default clears the old one
        assert defaults[0]["id"] == created["id"]

    def test_delete_address(self, client: TestClient, customer_headers: dict) -> None:
        response = client.delete("/api/auth/me/addresses/addr-office", headers=customer_headers)
        assert response.status_code == 204
        me = client.get("/api/auth/me", headers=customer_headers).json()
        assert all(a["id"] != "addr-office" for a in me["addresses"])

    def test_delete_unknown_address_404(self, client: TestClient, customer_headers: dict) -> None:
        response = client.delete("/api/auth/me/addresses/addr-nope", headers=customer_headers)
        assert response.status_code == 404
        assert response.json()["error"]["code"] == "NOT_FOUND"

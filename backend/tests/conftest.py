import pytest
from fastapi.testclient import TestClient

from app.main import create_app


@pytest.fixture()
def client() -> TestClient:
    """Fresh app (and fresh in-memory store) per test."""
    return TestClient(create_app())


def login(client: TestClient, email: str = "customer@example.com", password: str = "Password123!") -> dict:
    """Log in and return Authorization headers."""
    response = client.post("/api/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['token']}"}


@pytest.fixture()
def customer_headers(client: TestClient) -> dict:
    return login(client)


@pytest.fixture()
def admin_headers(client: TestClient) -> dict:
    return login(client, "admin@example.com", "Admin123!")

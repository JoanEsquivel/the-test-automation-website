from fastapi.testclient import TestClient

from app.main import create_app


def test_health_reports_backend_mode() -> None:
    client = TestClient(create_app())
    response = client.get("/api/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["mode"] == "backend"
    assert "version" in body

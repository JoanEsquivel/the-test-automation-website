"""Acceptance tests for the Files area (download/upload practice endpoints)."""

from fastapi.testclient import TestClient


class TestDownloads:
    def test_products_csv(self, client: TestClient) -> None:
        response = client.get("/api/files/products.csv")
        assert response.status_code == 200
        assert response.headers["content-type"].startswith("text/csv")
        assert 'attachment; filename="products.csv"' in response.headers["content-disposition"]
        text = response.text
        assert text.splitlines()[0] == "id,name,price,category,stock"
        assert "prod-aurora-headphones" in text

    def test_sample_pdf(self, client: TestClient) -> None:
        response = client.get("/api/files/sample-report.pdf")
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/pdf"
        assert "attachment" in response.headers["content-disposition"]
        assert response.content.startswith(b"%PDF-")


class TestUpload:
    def test_upload_echoes_metadata(self, client: TestClient) -> None:
        response = client.post(
            "/api/files/upload",
            files={"file": ("notes.txt", b"hello automation", "text/plain")},
        )
        assert response.status_code == 201
        assert response.json() == {
            "fileName": "notes.txt",
            "sizeBytes": 16,
            "contentType": "text/plain",
        }

    def test_upload_over_1mb_rejected(self, client: TestClient) -> None:
        big = b"x" * (1024 * 1024 + 1)
        response = client.post("/api/files/upload", files={"file": ("big.bin", big, "application/octet-stream")})
        assert response.status_code == 400
        assert response.json()["error"]["code"] == "VALIDATION_ERROR"

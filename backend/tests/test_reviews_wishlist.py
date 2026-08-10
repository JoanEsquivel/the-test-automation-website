"""Acceptance tests for Reviews and Wishlist — written FIRST from the API contract."""

from fastapi.testclient import TestClient


class TestReviews:
    def test_list_newest_first(self, client: TestClient) -> None:
        response = client.get("/api/products/prod-aurora-headphones/reviews")
        assert response.status_code == 200
        reviews = response.json()
        assert len(reviews) == 3
        dates = [r["createdAt"] for r in reviews]
        assert dates == sorted(dates, reverse=True)

    def test_empty_list_for_unreviewed_product(self, client: TestClient) -> None:
        assert client.get("/api/products/prod-kids-tracker/reviews").json() == []

    def test_post_requires_auth(self, client: TestClient) -> None:
        response = client.post(
            "/api/products/prod-kids-tracker/reviews",
            json={"rating": 5, "title": "Nice", "body": "Kid loves it."},
        )
        assert response.status_code == 401

    def test_post_review_updates_product_rating(self, client: TestClient, customer_headers: dict) -> None:
        response = client.post(
            "/api/products/prod-kids-tracker/reviews",
            json={"rating": 4, "title": "Solid tracker", "body": "Battery is great, kids approve."},
            headers=customer_headers,
        )
        assert response.status_code == 201
        review = response.json()
        assert review["authorName"] == "Casey Customer"
        assert review["userId"] == "user-customer"
        assert client.get("/api/products/prod-kids-tracker").json()["rating"] == 4.0

    def test_rating_out_of_range_rejected(self, client: TestClient, customer_headers: dict) -> None:
        for bad in (0, 6):
            response = client.post(
                "/api/products/prod-kids-tracker/reviews",
                json={"rating": bad, "title": "x", "body": "y"},
                headers=customer_headers,
            )
            assert response.status_code == 400

    def test_review_unknown_product_404(self, client: TestClient, customer_headers: dict) -> None:
        response = client.post(
            "/api/products/prod-nope/reviews",
            json={"rating": 5, "title": "x", "body": "y"},
            headers=customer_headers,
        )
        assert response.status_code == 404


class TestWishlist:
    def test_requires_auth(self, client: TestClient) -> None:
        assert client.get("/api/wishlist").status_code == 401

    def test_empty_wishlist(self, client: TestClient, customer_headers: dict) -> None:
        assert client.get("/api/wishlist", headers=customer_headers).json() == {"items": []}

    def test_add_and_list(self, client: TestClient, customer_headers: dict) -> None:
        response = client.post("/api/wishlist/prod-halo-ring", headers=customer_headers)
        assert response.status_code == 201
        items = client.get("/api/wishlist", headers=customer_headers).json()["items"]
        assert len(items) == 1
        assert items[0]["product"]["id"] == "prod-halo-ring"
        assert items[0]["addedAt"]

    def test_duplicate_conflict(self, client: TestClient, customer_headers: dict) -> None:
        client.post("/api/wishlist/prod-halo-ring", headers=customer_headers)
        response = client.post("/api/wishlist/prod-halo-ring", headers=customer_headers)
        assert response.status_code == 409
        assert response.json()["error"]["code"] == "ALREADY_IN_WISHLIST"

    def test_remove(self, client: TestClient, customer_headers: dict) -> None:
        client.post("/api/wishlist/prod-halo-ring", headers=customer_headers)
        assert client.delete("/api/wishlist/prod-halo-ring", headers=customer_headers).status_code == 204
        assert client.get("/api/wishlist", headers=customer_headers).json()["items"] == []

    def test_unknown_product_404(self, client: TestClient, customer_headers: dict) -> None:
        assert client.post("/api/wishlist/prod-nope", headers=customer_headers).status_code == 404

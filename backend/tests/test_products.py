"""Acceptance tests for Products & Categories — written FIRST from docs/02-specs/api-contract.md."""

from fastapi.testclient import TestClient


class TestProductList:
    def test_default_pagination(self, client: TestClient) -> None:
        response = client.get("/api/products")
        assert response.status_code == 200
        body = response.json()
        assert body["page"] == 1
        assert body["pageSize"] == 12
        assert body["total"] == 24
        assert body["totalPages"] == 2
        assert len(body["items"]) == 12

    def test_second_page(self, client: TestClient) -> None:
        body = client.get("/api/products?page=2").json()
        assert body["page"] == 2
        assert len(body["items"]) == 12

    def test_page_size_capped_at_48(self, client: TestClient) -> None:
        body = client.get("/api/products?pageSize=999").json()
        assert body["pageSize"] == 48

    def test_search_is_case_insensitive_on_name_and_description(self, client: TestClient) -> None:
        body = client.get("/api/products?search=AURORA").json()
        assert body["total"] == 1
        assert body["items"][0]["id"] == "prod-aurora-headphones"
        # 'truncation' appears only in the TrailMaster description
        body = client.get("/api/products?search=truncation").json()
        assert body["total"] == 1
        assert body["items"][0]["id"] == "prod-trail-watch"

    def test_category_filter(self, client: TestClient) -> None:
        body = client.get("/api/products?category=audio").json()
        assert body["total"] == 5
        assert all(p["category"] == "audio" for p in body["items"])

    def test_sort_price_asc(self, client: TestClient) -> None:
        items = client.get("/api/products?sort=price-asc&pageSize=48").json()["items"]
        prices = [p["price"] for p in items]
        assert prices == sorted(prices)
        assert items[0]["id"] == "prod-cable-clip"  # $0.99

    def test_sort_price_desc(self, client: TestClient) -> None:
        items = client.get("/api/products?sort=price-desc").json()["items"]
        assert items[0]["id"] == "prod-quantum-headset"  # $1299

    def test_sort_name_asc(self, client: TestClient) -> None:
        items = client.get("/api/products?sort=name-asc&pageSize=48").json()["items"]
        names = [p["name"].lower() for p in items]
        assert names == sorted(names)

    def test_sort_newest_is_default(self, client: TestClient) -> None:
        default_items = client.get("/api/products").json()["items"]
        newest_items = client.get("/api/products?sort=newest").json()["items"]
        assert default_items == newest_items
        dates = [p["createdAt"] for p in default_items]
        assert dates == sorted(dates, reverse=True)

    def test_sort_rating_desc(self, client: TestClient) -> None:
        items = client.get("/api/products?sort=rating-desc&pageSize=48").json()["items"]
        ratings = [p["rating"] for p in items]
        assert ratings == sorted(ratings, reverse=True)

    def test_search_and_filter_combine(self, client: TestClient) -> None:
        body = client.get("/api/products?category=gaming&search=keyboard").json()
        assert body["total"] == 1
        assert body["items"][0]["id"] == "prod-mech-keyboard"

    def test_empty_result(self, client: TestClient) -> None:
        body = client.get("/api/products?search=zzz-no-such-product").json()
        assert body["total"] == 0
        assert body["items"] == []


class TestProductDetail:
    def test_detail_includes_derived_rating(self, client: TestClient) -> None:
        response = client.get("/api/products/prod-aurora-headphones")
        assert response.status_code == 200
        product = response.json()
        assert product["name"] == "Aurora Wireless Headphones"
        # seed reviews: 5, 4, 5 -> avg 4.7 (1 decimal)
        assert product["rating"] == 4.7
        assert product["stock"] == 25

    def test_product_with_no_reviews_has_zero_rating(self, client: TestClient) -> None:
        product = client.get("/api/products/prod-kids-tracker").json()
        assert product["rating"] == 0

    def test_unknown_product_404_envelope(self, client: TestClient) -> None:
        response = client.get("/api/products/prod-nope")
        assert response.status_code == 404
        body = response.json()
        assert body["error"]["code"] == "NOT_FOUND"
        assert body["error"]["message"]


class TestCategories:
    def test_lists_five_categories(self, client: TestClient) -> None:
        response = client.get("/api/categories")
        assert response.status_code == 200
        categories = response.json()
        assert len(categories) == 5
        assert {c["id"] for c in categories} == {"audio", "wearables", "gaming", "smart-home", "accessories"}

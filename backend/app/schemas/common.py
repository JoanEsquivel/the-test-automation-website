from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    items: list[T]
    page: int
    pageSize: int
    total: int
    totalPages: int


def paginate(items: list, page: int, page_size: int) -> dict:
    total = len(items)
    total_pages = max(1, -(-total // page_size))
    start = (page - 1) * page_size
    return {
        "items": items[start : start + page_size],
        "page": page,
        "pageSize": page_size,
        "total": total,
        "totalPages": total_pages,
    }

from pydantic import BaseModel


class Product(BaseModel):
    id: str
    name: str
    description: str
    price: float
    category: str
    tags: list[str]
    stock: int
    imageEmoji: str
    rating: float
    createdAt: str


class Category(BaseModel):
    id: str
    name: str
    emoji: str
    description: str


class Review(BaseModel):
    id: str
    productId: str
    userId: str | None
    authorName: str
    rating: int
    title: str
    body: str
    createdAt: str

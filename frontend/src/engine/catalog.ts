/** Engine catalog — mirrors backend/app/routers/products.py behavior 1:1. */

import type { Category, Page, Product, ProductQuery, Review } from '@/api/types'
import { EngineError } from './errors'
import { db } from './store'

function productRating(productId: string): number {
  const ratings = db.reviews.filter((r) => r.productId === productId).map((r) => r.rating)
  if (ratings.length === 0) return 0
  return Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
}

function withRating(product: Omit<Product, 'rating'>): Product {
  return { ...product, rating: productRating(product.id) }
}

const SORTERS: Record<NonNullable<ProductQuery['sort']>, (a: Product, b: Product) => number> = {
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  'name-asc': (a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
  'name-desc': (a, b) => b.name.toLowerCase().localeCompare(a.name.toLowerCase()),
  'rating-desc': (a, b) => b.rating - a.rating,
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
}

export function paginate<T>(items: T[], page: number, pageSize: number): Page<T> {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = (page - 1) * pageSize
  return { items: items.slice(start, start + pageSize), page, pageSize, total, totalPages }
}

export function listProducts(query: ProductQuery): Page<Product> {
  const pageSize = Math.min(query.pageSize ?? 12, 48)
  const page = query.page ?? 1
  let products = db.products.map(withRating)

  if (query.search) {
    const needle = query.search.toLowerCase()
    products = products.filter(
      (p) => p.name.toLowerCase().includes(needle) || p.description.toLowerCase().includes(needle),
    )
  }
  if (query.category) {
    products = products.filter((p) => p.category === query.category)
  }
  products.sort(SORTERS[query.sort ?? 'newest'])
  return paginate(products, page, pageSize)
}

export function getProduct(productId: string): Product {
  const product = db.products.find((p) => p.id === productId)
  if (!product) {
    throw new EngineError(404, 'NOT_FOUND', `Product '${productId}' was not found.`)
  }
  return withRating(product)
}

export function listCategories(): Category[] {
  return db.categories
}

export function listReviews(productId: string): Review[] {
  getProduct(productId) // 404 guard
  return db.reviews
    .filter((r) => r.productId === productId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

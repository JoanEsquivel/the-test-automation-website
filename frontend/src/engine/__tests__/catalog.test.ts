// ATDD: engine catalog must return the same results the FastAPI backend returns
// for identical queries (parity is enforced by the shared seed + these mirrored tests).
import { beforeEach, describe, expect, it } from 'vitest'

import { getProduct, listCategories, listProducts } from '../catalog'
import { resetAll } from '../store'

beforeEach(() => {
  localStorage.clear()
  resetAll()
})

describe('engine catalog.listProducts', () => {
  it('paginates 24 seed products at 12 per page', () => {
    const page = listProducts({})
    expect(page.total).toBe(24)
    expect(page.pageSize).toBe(12)
    expect(page.totalPages).toBe(2)
    expect(page.items).toHaveLength(12)
  })

  it('searches name and description case-insensitively', () => {
    expect(listProducts({ search: 'AURORA' }).items[0]?.id).toBe('prod-aurora-headphones')
    expect(listProducts({ search: 'truncation' }).items[0]?.id).toBe('prod-trail-watch')
  })

  it('filters by category', () => {
    const page = listProducts({ category: 'audio' })
    expect(page.total).toBe(5)
    expect(page.items.every((p) => p.category === 'audio')).toBe(true)
  })

  it('sorts by price ascending with the cheapest first', () => {
    const items = listProducts({ sort: 'price-asc', pageSize: 48 }).items
    expect(items[0]?.id).toBe('prod-cable-clip')
    const prices = items.map((p) => p.price)
    expect(prices).toEqual([...prices].sort((a, b) => a - b))
  })

  it('defaults to newest first', () => {
    const dates = listProducts({}).items.map((p) => p.createdAt)
    expect(dates).toEqual([...dates].sort().reverse())
  })

  it('caps pageSize at 48', () => {
    expect(listProducts({ pageSize: 999 }).pageSize).toBe(48)
  })
})

describe('engine catalog.getProduct', () => {
  it('derives rating from seed reviews (aurora: 5,4,5 -> 4.7)', () => {
    expect(getProduct('prod-aurora-headphones').rating).toBe(4.7)
  })

  it('returns 0 rating for unreviewed products', () => {
    expect(getProduct('prod-kids-tracker').rating).toBe(0)
  })

  it('throws NOT_FOUND for unknown ids', () => {
    expect(() => getProduct('prod-nope')).toThrowError(
      expect.objectContaining({ status: 404, code: 'NOT_FOUND' }),
    )
  })
})

describe('engine catalog.listCategories', () => {
  it('lists the five seed categories', () => {
    expect(listCategories().map((c) => c.id).sort()).toEqual([
      'accessories',
      'audio',
      'gaming',
      'smart-home',
      'wearables',
    ])
  })
})

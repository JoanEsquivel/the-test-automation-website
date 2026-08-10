/** The single typed API client. UI code never knows which mode is active:
 * it always calls these functions, which always issue real fetch() requests.
 * In backend mode they hit FastAPI; in browser mode MSW intercepts them. */

import { apiBase } from './mode'
import type {
  AddressInput,
  AdminStats,
  ApiErrorBody,
  AuthResponse,
  Cart,
  Category,
  CouponValidation,
  Health,
  Order,
  Page,
  PaymentInput,
  Product,
  ProductQuery,
  Review,
  UploadEcho,
  User,
  WishlistEntry,
} from './types'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useModeStore } from '@/stores/mode'

export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

interface RequestOptions {
  body?: unknown
  formData?: FormData
  query?: Record<string, string | number | undefined>
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const base = apiBase(useModeStore.getState().mode)
  const url = new URL(base + path, window.location.origin)
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value))
  }

  const headers: Record<string, string> = {}
  const token = useAuthStore.getState().token
  if (token) headers.Authorization = `Bearer ${token}`
  const cartId = useCartStore.getState().cartId
  if (cartId) headers['X-Cart-Id'] = cartId
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'

  const response = await fetch(url, {
    method,
    headers,
    body: options.formData ?? (options.body !== undefined ? JSON.stringify(options.body) : undefined),
  })

  if (response.status === 204) return undefined as T

  if (!response.ok) {
    let code = 'ERROR'
    let message = `Request failed with status ${response.status}.`
    try {
      const body = (await response.json()) as ApiErrorBody
      code = body.error.code
      message = body.error.message
    } catch {
      // non-JSON error body; keep defaults
    }
    throw new ApiError(response.status, code, message)
  }
  return (await response.json()) as T
}

export const api = {
  health: () => request<Health>('GET', '/health'),

  auth: {
    register: (input: { email: string; password: string; name: string }) =>
      request<AuthResponse>('POST', '/auth/register', { body: input }),
    login: (input: { email: string; password: string }) =>
      request<AuthResponse>('POST', '/auth/login', { body: input }),
    logout: () => request<void>('POST', '/auth/logout'),
    me: () => request<User>('GET', '/auth/me'),
    updateProfile: (input: { name: string }) => request<User>('PUT', '/auth/me', { body: input }),
    addAddress: (input: AddressInput) => request<AddressInput & { id: string }>('POST', '/auth/me/addresses', { body: input }),
    updateAddress: (id: string, input: AddressInput) =>
      request<AddressInput & { id: string }>('PUT', `/auth/me/addresses/${id}`, { body: input }),
    deleteAddress: (id: string) => request<void>('DELETE', `/auth/me/addresses/${id}`),
  },

  catalog: {
    products: (query: ProductQuery = {}) => request<Page<Product>>('GET', '/products', { query: { ...query } }),
    product: (id: string) => request<Product>('GET', `/products/${id}`),
    categories: () => request<Category[]>('GET', '/categories'),
    reviews: (productId: string) => request<Review[]>('GET', `/products/${productId}/reviews`),
    addReview: (productId: string, input: { rating: number; title: string; body: string }) =>
      request<Review>('POST', `/products/${productId}/reviews`, { body: input }),
  },

  cart: {
    create: () => request<{ cartId: string }>('POST', '/cart'),
    get: () => request<Cart>('GET', '/cart'),
    addItem: (productId: string, qty: number) => request<Cart>('POST', '/cart/items', { body: { productId, qty } }),
    updateItem: (productId: string, qty: number) =>
      request<Cart>('PATCH', `/cart/items/${productId}`, { body: { qty } }),
    removeItem: (productId: string) => request<Cart>('DELETE', `/cart/items/${productId}`),
    applyCoupon: (code: string) => request<Cart>('POST', '/cart/coupon', { body: { code } }),
    removeCoupon: () => request<Cart>('DELETE', '/cart/coupon'),
  },

  coupons: {
    validate: (code: string, subtotal: number) =>
      request<CouponValidation>('POST', '/coupons/validate', { body: { code, subtotal } }),
  },

  orders: {
    checkout: (input: { shippingAddress: AddressInput; payment: PaymentInput }) =>
      request<Order>('POST', '/orders', { body: input }),
    list: () => request<Order[]>('GET', '/orders'),
    get: (id: string) => request<Order>('GET', `/orders/${id}`),
  },

  wishlist: {
    list: () => request<{ items: WishlistEntry[] }>('GET', '/wishlist'),
    add: (productId: string) => request<{ productId: string; addedAt: string }>('POST', `/wishlist/${productId}`),
    remove: (productId: string) => request<void>('DELETE', `/wishlist/${productId}`),
  },

  files: {
    /** Returns the absolute URL for download links (works in both modes). */
    downloadUrl: (name: 'products.csv' | 'sample-report.pdf') =>
      new URL(`${apiBase(useModeStore.getState().mode)}/files/${name}`, window.location.origin).toString(),
    upload: (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      return request<UploadEcho>('POST', '/files/upload', { formData })
    },
  },

  admin: {
    products: (query: { search?: string; page?: number; pageSize?: number } = {}) =>
      request<Page<Product>>('GET', '/admin/products', { query: { ...query } }),
    createProduct: (input: Omit<Product, 'id' | 'rating' | 'createdAt'>) =>
      request<Product>('POST', '/admin/products', { body: input }),
    updateProduct: (id: string, input: Partial<Omit<Product, 'id' | 'rating' | 'createdAt'>>) =>
      request<Product>('PUT', `/admin/products/${id}`, { body: input }),
    deleteProduct: (id: string) => request<void>('DELETE', `/admin/products/${id}`),
    orders: (status?: string) => request<Order[]>('GET', '/admin/orders', { query: { status } }),
    updateOrderStatus: (id: string, status: string) =>
      request<Order>('PATCH', `/admin/orders/${id}/status`, { body: { status } }),
    stats: () => request<AdminStats>('GET', '/admin/stats'),
  },
}

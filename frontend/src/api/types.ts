/** TypeScript mirror of the normative API contract (docs/02-specs/api-contract.md). */

export interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  tags: string[]
  stock: number
  imageEmoji: string
  rating: number
  createdAt: string
}

export interface Category {
  id: string
  name: string
  emoji: string
  description: string
}

export interface Review {
  id: string
  productId: string
  userId: string | null
  authorName: string
  rating: number
  title: string
  body: string
  createdAt: string
}

export interface Address {
  id: string
  label: string
  fullName: string
  street: string
  city: string
  zip: string
  country: string
  isDefault: boolean
}

export type AddressInput = Omit<Address, 'id'>

export interface User {
  id: string
  email: string
  name: string
  role: 'customer' | 'admin'
  addresses: Address[]
}

export interface AuthResponse {
  token: string
  user: User
}

export interface CartItem {
  productId: string
  name: string
  unitPrice: number
  qty: number
  lineTotal: number
}

export interface Totals {
  subtotal: number
  discount: number
  shipping: number
  tax: number
  total: number
}

export interface Cart {
  id: string
  items: CartItem[]
  couponCode: string | null
  totals: Totals
}

export interface Order {
  id: string
  orderNumber: string
  userId: string
  items: CartItem[]
  shippingAddress: AddressInput
  paymentMethod: { type: string; last4: string }
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
  totals: Totals
  createdAt: string
}

export interface PaymentInput {
  cardNumber: string
  expiry: string
  cvc: string
  cardHolder: string
}

export interface Coupon {
  code: string
  type: 'percent' | 'fixed'
  value: number
  minSubtotal: number
  expiresAt: string
  active: boolean
}

export interface CouponValidation {
  valid: boolean
  type: 'percent' | 'fixed'
  value: number
  discount: number
}

export interface WishlistEntry {
  product: Product
  addedAt: string
}

export interface Page<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface ProductQuery {
  search?: string
  category?: string
  sort?: 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc' | 'rating-desc' | 'newest'
  page?: number
  pageSize?: number
}

export interface UploadEcho {
  fileName: string
  sizeBytes: number
  contentType: string
}

export interface AdminStats {
  totalRevenue: number
  orderCount: number
  ordersByStatus: Record<string, number>
  revenueByCategory: { category: string; revenue: number }[]
  topProducts: { productId: string; name: string; unitsSold: number }[]
}

export interface Health {
  status: string
  mode: 'backend' | 'browser'
  version: string
}

export interface ApiErrorBody {
  error: { code: string; message: string }
}

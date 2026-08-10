import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CartState {
  /** Guest cart id sent as X-Cart-Id; null once logged in (token identifies the cart). */
  cartId: string | null
  /** Live item count shown in the header badge. */
  itemCount: number
  setCartId: (cartId: string | null) => void
  setItemCount: (itemCount: number) => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      cartId: null,
      itemCount: 0,
      setCartId: (cartId) => set({ cartId }),
      setItemCount: (itemCount) => set({ itemCount }),
    }),
    { name: 'taw:cart' },
  ),
)

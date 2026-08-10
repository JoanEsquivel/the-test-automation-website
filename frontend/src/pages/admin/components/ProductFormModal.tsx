import { useState } from 'react'
import type { FormEvent } from 'react'

import type { Category, Product } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

export interface ProductFormValues {
  name: string
  description: string
  price: number
  category: string
  tags: string[]
  stock: number
  imageEmoji: string
}

type Errors = Partial<Record<'name' | 'description' | 'price' | 'category' | 'stock', string>>

interface ProductFormModalProps {
  /** `null` opens an empty create form. */
  product: Product | null
  categories: Category[]
  busy: boolean
  onSubmit: (values: ProductFormValues) => void
  onClose: () => void
}

function initialValues(product: Product | null, categories: Category[]): ProductFormValues {
  return {
    name: product?.name ?? '',
    description: product?.description ?? '',
    price: product?.price ?? 0,
    category: product?.category ?? categories[0]?.id ?? '',
    tags: product?.tags ?? [],
    stock: product?.stock ?? 0,
    imageEmoji: product?.imageEmoji ?? '📦',
  }
}

const FIELD_CLASS =
  'w-full rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-mist-50 placeholder:text-mist-500 focus:border-volt-400 focus:outline-none'

/** Inline validation message rendered under a field. */
function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} data-testid={`${id}-error`} className="mt-1 text-xs font-medium text-red-300">
      {message}
    </p>
  )
}

export function ProductFormModal({ product, categories, busy, onSubmit, onClose }: ProductFormModalProps) {
  const [values, setValues] = useState<ProductFormValues>(() => initialValues(product, categories))
  const [tagText, setTagText] = useState(product?.tags.join(', ') ?? '')
  const [errors, setErrors] = useState<Errors>({})

  function patch(next: Partial<ProductFormValues>) {
    setValues((current) => ({ ...current, ...next }))
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const next: Errors = {}
    if (!values.name.trim()) next.name = 'Name is required.'
    if (!values.description.trim()) next.description = 'Description is required.'
    if (Number.isNaN(values.price) || values.price < 0) next.price = 'Price must be zero or greater.'
    if (!values.category) next.category = 'Pick a category.'
    if (!Number.isInteger(values.stock) || values.stock < 0) next.stock = 'Stock must be a whole number.'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    onSubmit({
      ...values,
      name: values.name.trim(),
      description: values.description.trim(),
      imageEmoji: values.imageEmoji.trim() || '📦',
      tags: tagText
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    })
  }

  return (
    <Modal
      title={product ? `Edit “${product.name}”` : 'New product'}
      description={
        product
          ? 'Sends a partial PUT /api/admin/products/{id}; only the fields you change are persisted.'
          : 'Sends POST /api/admin/products and the product appears in the public catalog immediately.'
      }
      onClose={onClose}
      data-testid="product-form"
    >
      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="product-form-name" className="mb-1.5 block text-sm font-medium text-mist-200">
            Name
          </label>
          <input
            id="product-form-name"
            data-testid="product-form-name"
            className={FIELD_CLASS}
            value={values.name}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? 'product-form-name-error' : undefined}
            onChange={(event) => patch({ name: event.target.value })}
          />
          <FieldError id="product-form-name" message={errors.name} />
        </div>

        <div>
          <label htmlFor="product-form-description" className="mb-1.5 block text-sm font-medium text-mist-200">
            Description
          </label>
          <textarea
            id="product-form-description"
            data-testid="product-form-description"
            rows={3}
            className={FIELD_CLASS}
            value={values.description}
            aria-invalid={errors.description ? true : undefined}
            onChange={(event) => patch({ description: event.target.value })}
          />
          <FieldError id="product-form-description" message={errors.description} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="product-form-price" className="mb-1.5 block text-sm font-medium text-mist-200">
              Price (USD)
            </label>
            <input
              id="product-form-price"
              data-testid="product-form-price"
              type="number"
              min={0}
              step="0.01"
              className={FIELD_CLASS}
              value={values.price}
              aria-invalid={errors.price ? true : undefined}
              onChange={(event) => patch({ price: Number(event.target.value) })}
            />
            <FieldError id="product-form-price" message={errors.price} />
          </div>
          <div>
            <label htmlFor="product-form-stock" className="mb-1.5 block text-sm font-medium text-mist-200">
              Stock
            </label>
            <input
              id="product-form-stock"
              data-testid="product-form-stock"
              type="number"
              min={0}
              step="1"
              className={FIELD_CLASS}
              value={values.stock}
              aria-invalid={errors.stock ? true : undefined}
              onChange={(event) => patch({ stock: Number(event.target.value) })}
            />
            <FieldError id="product-form-stock" message={errors.stock} />
          </div>
          <div>
            <label htmlFor="product-form-emoji" className="mb-1.5 block text-sm font-medium text-mist-200">
              Emoji
            </label>
            <input
              id="product-form-emoji"
              data-testid="product-form-emoji"
              className={FIELD_CLASS}
              value={values.imageEmoji}
              onChange={(event) => patch({ imageEmoji: event.target.value })}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="product-form-category" className="mb-1.5 block text-sm font-medium text-mist-200">
              Category
            </label>
            <select
              id="product-form-category"
              data-testid="product-form-category"
              className={FIELD_CLASS}
              value={values.category}
              aria-invalid={errors.category ? true : undefined}
              onChange={(event) => patch({ category: event.target.value })}
            >
              <option value="">Choose a category…</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <FieldError id="product-form-category" message={errors.category} />
          </div>
          <div>
            <label htmlFor="product-form-tags" className="mb-1.5 block text-sm font-medium text-mist-200">
              Tags
            </label>
            <input
              id="product-form-tags"
              data-testid="product-form-tags"
              className={FIELD_CLASS}
              placeholder="wireless, anc"
              value={tagText}
              onChange={(event) => setTagText(event.target.value)}
            />
            <p className="mt-1 text-xs text-mist-500">Comma separated.</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" data-testid="product-form-cancel" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" data-testid="product-form-submit" disabled={busy}>
            {busy ? 'Saving…' : product ? 'Save changes' : 'Create product'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

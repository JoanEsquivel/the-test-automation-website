import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { api } from '@/api/client'
import { errorMessage } from '@/api/errorMessage'
import type { Address, AddressInput, User } from '@/api/types'
import { Badge } from '@/components/ui/Badge'
import { Banner } from '@/components/ui/Banner'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { PageIntro } from '@/components/ui/PageIntro'
import { useToast } from '@/components/ui/Toast'
import { AddressForm, EMPTY_ADDRESS, validateAddress } from '@/pages/shop/components/AddressForm'
import type { AddressErrors } from '@/pages/shop/components/AddressForm'
import { ListSkeleton } from '@/pages/shop/components/Skeletons'
import { useAuthStore } from '@/stores/auth'
import { AddressCard } from './components/AddressCard'
import { TextField } from './components/TextField'

type Editing = { mode: 'new' } | { mode: 'edit'; address: Address } | null

export default function ProfilePage() {
  const setStoreUser = useAuthStore((state) => state.setUser)
  const toast = useToast()

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [nameError, setNameError] = useState<string | undefined>(undefined)
  const [savingName, setSavingName] = useState(false)

  const [editing, setEditing] = useState<Editing>(null)
  const [draft, setDraft] = useState<AddressInput>(EMPTY_ADDRESS)
  const [draftErrors, setDraftErrors] = useState<AddressErrors>({})
  const [savingAddress, setSavingAddress] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Address | null>(null)

  /** Single source of truth: re-read the account and republish it to the store
   * so the header (and every other page) reflects the mutation immediately. */
  const refresh = useCallback(async () => {
    const fresh = await api.auth.me()
    setUser(fresh)
    setStoreUser(fresh)
    return fresh
  }, [setStoreUser])

  useEffect(() => {
    let active = true
    setLoading(true)
    api.auth
      .me()
      .then((fresh) => {
        if (!active) return
        setUser(fresh)
        setStoreUser(fresh)
        setName(fresh.name)
        setLoading(false)
      })
      .catch((cause: unknown) => {
        if (!active) return
        setError(errorMessage(cause, 'Your profile could not be loaded.'))
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [setStoreUser])

  async function handleSaveName() {
    if (!name.trim()) {
      setNameError('Display name is required.')
      return
    }
    setNameError(undefined)
    setSavingName(true)
    try {
      await api.auth.updateProfile({ name: name.trim() })
      await refresh()
      toast({ tone: 'success', message: 'Your display name was updated.' })
    } catch (cause) {
      toast({ tone: 'danger', message: errorMessage(cause, 'The profile could not be saved.') })
    } finally {
      setSavingName(false)
    }
  }

  function openNewAddress() {
    setEditing({ mode: 'new' })
    setDraft(EMPTY_ADDRESS)
    setDraftErrors({})
  }

  function openEditAddress(address: Address) {
    const { id: _id, ...rest } = address
    setEditing({ mode: 'edit', address })
    setDraft(rest)
    setDraftErrors({})
  }

  async function handleSaveAddress() {
    const errors = validateAddress(draft)
    setDraftErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSavingAddress(true)
    try {
      if (editing?.mode === 'edit') {
        await api.auth.updateAddress(editing.address.id, draft)
      } else {
        await api.auth.addAddress(draft)
      }
      await refresh()
      setEditing(null)
      toast({ tone: 'success', message: editing?.mode === 'edit' ? 'Address updated.' : 'Address added.' })
    } catch (cause) {
      toast({ tone: 'danger', message: errorMessage(cause, 'The address could not be saved.') })
    } finally {
      setSavingAddress(false)
    }
  }

  async function handleSetDefault(address: Address) {
    const { id: _id, ...rest } = address
    setBusyId(address.id)
    try {
      // The API clears the previous default for us; refreshing reflects that live.
      await api.auth.updateAddress(address.id, { ...rest, isDefault: true })
      await refresh()
      toast({ tone: 'success', message: `“${address.label}” is now your default address.` })
    } catch (cause) {
      toast({ tone: 'danger', message: errorMessage(cause, 'The default address could not be changed.') })
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return
    setBusyId(pendingDelete.id)
    try {
      await api.auth.deleteAddress(pendingDelete.id)
      await refresh()
      toast({ tone: 'success', message: `“${pendingDelete.label}” was removed.` })
      setPendingDelete(null)
    } catch (cause) {
      toast({ tone: 'danger', message: errorMessage(cause, 'The address could not be deleted.') })
    } finally {
      setBusyId(null)
    }
  }

  const addresses = user?.addresses ?? []

  return (
    <div className="space-y-8">
      <PageIntro
        title="Profile"
        what="Your account details and address book. The name field writes to PUT /api/auth/me; every address action maps to one /api/auth/me/addresses call, and the response is republished to the header immediately."
        how="Rename yourself and save, then add, edit, promote or delete addresses. Promoting one address clears the previous default server-side — watch the badge move. Deleting always asks for confirmation first."
      />

      {error && (
        <Banner tone="danger" data-testid="profile-error">
          {error}
        </Banner>
      )}

      {loading && <ListSkeleton rows={2} testId="profile-skeleton" />}

      {!loading && user && (
        <>
          <section
            aria-labelledby="account-heading"
            className="rounded-2xl border border-ink-700 bg-ink-900 p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="account-heading" className="font-display text-lg font-bold text-mist-50">
                Account
              </h2>
              <Badge tone={user.role === 'admin' ? 'pulse' : 'volt'} data-testid="profile-role">
                {user.role}
              </Badge>
            </div>

            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-widest text-mist-500">Email</dt>
                <dd data-testid="profile-email" className="mt-1 font-mono text-sm text-mist-200">
                  {user.email}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-widest text-mist-500">User id</dt>
                <dd data-testid="profile-user-id" className="mt-1 font-mono text-sm text-mist-200">
                  {user.id}
                </dd>
              </div>
            </dl>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <TextField
                  id="profile-name-input"
                  label="Display name"
                  autoComplete="name"
                  value={name}
                  onChange={setName}
                  error={nameError}
                />
              </div>
              <Button data-testid="save-profile" onClick={handleSaveName} disabled={savingName}>
                {savingName ? 'Saving…' : 'Save name'}
              </Button>
            </div>

            <p className="mt-5 text-sm text-mist-400">
              Looking for what you bought?{' '}
              <Link
                to="/shop/orders"
                data-testid="profile-orders-link"
                className="font-semibold text-volt-400 hover:underline"
              >
                Open your order history
              </Link>
              .
            </p>
          </section>

          <section aria-labelledby="addresses-heading" className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="addresses-heading" className="font-display text-lg font-bold text-mist-50">
                Address book
              </h2>
              <Button data-testid="add-address" onClick={openNewAddress} disabled={editing !== null}>
                Add an address
              </Button>
            </div>

            {editing && (
              <div
                data-testid="address-editor"
                className="rounded-2xl border border-volt-500/40 bg-ink-900 p-6"
              >
                <h3 className="font-display text-base font-bold text-mist-50">
                  {editing.mode === 'edit' ? `Edit “${editing.address.label}”` : 'New address'}
                </h3>
                <div className="mt-4">
                  <AddressForm value={draft} errors={draftErrors} onChange={setDraft} />
                </div>
                <label className="mt-4 flex items-center gap-2 text-sm text-mist-300">
                  <input
                    type="checkbox"
                    data-testid="address-is-default"
                    checked={draft.isDefault}
                    onChange={(event) => setDraft({ ...draft, isDefault: event.target.checked })}
                    className="size-4 rounded border-ink-600 bg-ink-800 accent-volt-500"
                  />
                  Make this my default address
                </label>
                <div className="mt-5 flex gap-2">
                  <Button data-testid="save-address" onClick={handleSaveAddress} disabled={savingAddress}>
                    {savingAddress ? 'Saving…' : 'Save address'}
                  </Button>
                  <Button
                    variant="secondary"
                    data-testid="cancel-address"
                    onClick={() => setEditing(null)}
                    disabled={savingAddress}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {addresses.length === 0 ? (
              <p
                data-testid="empty-addresses"
                className="rounded-2xl border border-dashed border-ink-600 bg-ink-900 p-8 text-center text-sm text-mist-400"
              >
                No saved addresses yet — add one here and it becomes selectable at checkout.
              </p>
            ) : (
              <ul data-testid="address-list" className="grid gap-4 sm:grid-cols-2">
                {addresses.map((address) => (
                  <AddressCard
                    key={address.id}
                    address={address}
                    busy={busyId === address.id}
                    onEdit={openEditAddress}
                    onSetDefault={handleSetDefault}
                    onDelete={setPendingDelete}
                  />
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Delete this address?"
          message={`“${pendingDelete.label}” will be removed from your address book. Orders already placed keep their own snapshot of it.`}
          busy={busyId === pendingDelete.id}
          onConfirm={handleDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  )
}

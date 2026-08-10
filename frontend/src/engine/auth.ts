/** Engine auth — mirrors backend/app/routers/auth.py behavior 1:1. */

import type { AddressInput, AuthResponse, User } from '@/api/types'
import { EngineError } from './errors'
import { db, newId, type StoredUser } from './store'
import { createToken, decodeToken } from './token'

function toPublicUser(user: StoredUser): User {
  const { password: _password, ...rest } = user
  return rest
}

function findByEmail(email: string): StoredUser | undefined {
  const lowered = email.toLowerCase()
  return db.users.find((u) => u.email.toLowerCase() === lowered)
}

export function requireUser(token: string | null): StoredUser {
  if (!token) {
    throw new EngineError(401, 'UNAUTHORIZED', 'Authentication required. Send a Bearer token.')
  }
  const payload = decodeToken(token)
  const user = db.users.find((u) => u.id === payload.sub)
  if (!user) {
    throw new EngineError(401, 'UNAUTHORIZED', 'User for this token no longer exists.')
  }
  return user
}

export function optionalUser(token: string | null): StoredUser | null {
  return token ? requireUser(token) : null
}

export function register(input: { email: string; password: string; name: string }): AuthResponse {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    throw new EngineError(400, 'VALIDATION_ERROR', 'email: value is not a valid email address')
  }
  if (input.password.length < 8 || !/\d/.test(input.password)) {
    throw new EngineError(400, 'VALIDATION_ERROR', 'password: must be at least 8 characters and contain a digit.')
  }
  if (!input.name.trim()) {
    throw new EngineError(400, 'VALIDATION_ERROR', 'name: is required.')
  }
  if (findByEmail(input.email)) {
    throw new EngineError(409, 'EMAIL_TAKEN', 'An account with this email already exists.')
  }
  const user: StoredUser = {
    id: newId('user'),
    email: input.email,
    password: input.password,
    name: input.name.trim(),
    role: 'customer',
    addresses: [],
  }
  db.users = [...db.users, user]
  return { token: createToken(user), user: toPublicUser(user) }
}

export function login(input: { email: string; password: string }): AuthResponse {
  const user = findByEmail(input.email)
  if (!user || user.password !== input.password) {
    throw new EngineError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.')
  }
  return { token: createToken(user), user: toPublicUser(user) }
}

export function me(token: string | null): User {
  return toPublicUser(requireUser(token))
}

export function updateProfile(token: string | null, input: { name: string }): User {
  const user = requireUser(token)
  if (!input.name.trim()) {
    throw new EngineError(400, 'VALIDATION_ERROR', 'name: is required.')
  }
  const updated = { ...user, name: input.name.trim() }
  db.users = db.users.map((u) => (u.id === user.id ? updated : u))
  return toPublicUser(updated)
}

export function addAddress(token: string | null, input: AddressInput) {
  const user = requireUser(token)
  const address = { id: newId('addr'), ...input }
  const addresses = input.isDefault
    ? user.addresses.map((a) => ({ ...a, isDefault: false }))
    : [...user.addresses]
  addresses.push(address)
  db.users = db.users.map((u) => (u.id === user.id ? { ...u, addresses } : u))
  return address
}

export function updateAddress(token: string | null, addressId: string, input: AddressInput) {
  const user = requireUser(token)
  if (!user.addresses.some((a) => a.id === addressId)) {
    throw new EngineError(404, 'NOT_FOUND', `Address '${addressId}' was not found.`)
  }
  let addresses = user.addresses
  if (input.isDefault) {
    addresses = addresses.map((a) => ({ ...a, isDefault: false }))
  }
  addresses = addresses.map((a) => (a.id === addressId ? { ...a, ...input, id: addressId } : a))
  db.users = db.users.map((u) => (u.id === user.id ? { ...u, addresses } : u))
  return addresses.find((a) => a.id === addressId)!
}

export function deleteAddress(token: string | null, addressId: string): void {
  const user = requireUser(token)
  if (!user.addresses.some((a) => a.id === addressId)) {
    throw new EngineError(404, 'NOT_FOUND', `Address '${addressId}' was not found.`)
  }
  db.users = db.users.map((u) =>
    u.id === user.id ? { ...u, addresses: u.addresses.filter((a) => a.id !== addressId) } : u,
  )
}

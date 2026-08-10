/** Fake-but-structurally-real JWTs for browser mode.
 *
 * Same claim structure as the FastAPI backend (sub, role, name, exp) so client
 * code and learner tooling can decode them identically. The signature is a
 * static placeholder — honestly documented in the UI: browser-mode tokens are
 * simulated and never verified cryptographically.
 */

import { EngineError } from './errors'

export interface TokenPayload {
  sub: string
  role: 'customer' | 'admin'
  name: string
  exp: number
}

const HEADER = { alg: 'HS256', typ: 'JWT' }
const FAKE_SIGNATURE = 'taw-browser-mode-simulated-signature'
const EXPIRY_HOURS = 24

function base64UrlEncode(value: unknown): string {
  return btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode<T>(value: string): T {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/')
  return JSON.parse(atob(padded)) as T
}

export function createToken(user: { id: string; role: 'customer' | 'admin'; name: string }): string {
  const payload: TokenPayload = {
    sub: user.id,
    role: user.role,
    name: user.name,
    exp: Math.floor(Date.now() / 1000) + EXPIRY_HOURS * 3600,
  }
  return `${base64UrlEncode(HEADER)}.${base64UrlEncode(payload)}.${FAKE_SIGNATURE}`
}

export function decodeToken(token: string): TokenPayload {
  const parts = token.split('.')
  if (parts.length !== 3) {
    throw new EngineError(401, 'UNAUTHORIZED', 'Invalid authentication token.')
  }
  let payload: TokenPayload
  try {
    payload = base64UrlDecode<TokenPayload>(parts[1]!)
  } catch {
    throw new EngineError(401, 'UNAUTHORIZED', 'Invalid authentication token.')
  }
  if (payload.exp * 1000 < Date.now()) {
    throw new EngineError(401, 'TOKEN_EXPIRED', 'Your session has expired. Please log in again.')
  }
  return payload
}

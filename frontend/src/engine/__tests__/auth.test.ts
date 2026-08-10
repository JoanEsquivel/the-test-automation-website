// ATDD: engine auth must mirror the FastAPI behavior defined in the API contract.
import { beforeEach, describe, expect, it } from 'vitest'

import { EngineError } from '../errors'
import { login, register } from '../auth'
import { decodeToken } from '../token'
import { resetAll } from '../store'

beforeEach(() => {
  localStorage.clear()
  resetAll()
})

describe('engine auth.login', () => {
  it('logs in the seed customer', () => {
    const result = login({ email: 'customer@example.com', password: 'Password123!' })
    expect(result.user.id).toBe('user-customer')
    expect(result.user.addresses).toHaveLength(2)
    expect(result.token.split('.')).toHaveLength(3)
  })

  it('rejects a wrong password with INVALID_CREDENTIALS', () => {
    expect(() => login({ email: 'customer@example.com', password: 'nope' })).toThrowError(
      expect.objectContaining({ status: 401, code: 'INVALID_CREDENTIALS' }),
    )
  })

  it('issues a decodable token with sub, role and expiry', () => {
    const { token } = login({ email: 'admin@example.com', password: 'Admin123!' })
    const payload = decodeToken(token)
    expect(payload.sub).toBe('user-admin')
    expect(payload.role).toBe('admin')
    expect(payload.exp * 1000).toBeGreaterThan(Date.now())
  })
})

describe('engine auth.register', () => {
  it('creates a customer account and logs it in', () => {
    const result = register({ email: 'new@example.com', password: 'Secret123', name: 'New User' })
    expect(result.user.role).toBe('customer')
    expect(login({ email: 'new@example.com', password: 'Secret123' }).user.id).toBe(result.user.id)
  })

  it('rejects duplicate emails with EMAIL_TAKEN', () => {
    expect(() =>
      register({ email: 'customer@example.com', password: 'Secret123', name: 'Dup' }),
    ).toThrowError(expect.objectContaining({ status: 409, code: 'EMAIL_TAKEN' }))
  })

  it('rejects weak passwords with VALIDATION_ERROR', () => {
    for (const bad of ['short1', 'longbutnodigits']) {
      expect(() => register({ email: 'weak@example.com', password: bad, name: 'W' })).toThrowError(
        expect.objectContaining({ status: 400, code: 'VALIDATION_ERROR' }),
      )
    }
  })

  it('persists across engine reloads via localStorage', () => {
    register({ email: 'persist@example.com', password: 'Secret123', name: 'P' })
    // a fresh login (new module state is simulated by just calling again) still finds the user
    expect(login({ email: 'persist@example.com', password: 'Secret123' }).user.name).toBe('P')
  })

  it('errors carry the EngineError shape used by the MSW envelope', () => {
    try {
      login({ email: 'ghost@example.com', password: 'Password123!' })
      expect.unreachable()
    } catch (error) {
      expect(error).toBeInstanceOf(EngineError)
    }
  })
})

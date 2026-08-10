// ATDD: browser-mode files engine — CSV mirrors db.products, PDF carries the
// %PDF- magic bytes, uploads over 1 MB are rejected with VALIDATION_ERROR.
import { beforeEach, describe, expect, it } from 'vitest'

import { EngineError } from '@/engine/errors'
import { echoUpload, productsCsv, sampleReportPdf } from '@/engine/files'
import { db } from '@/engine/store'

beforeEach(() => {
  localStorage.clear()
})

describe('productsCsv', () => {
  it('starts with the exact header row', () => {
    expect(productsCsv().split('\n')[0]).toBe('id,name,price,category,stock')
  })

  it('has one data row per seeded product', () => {
    const lines = productsCsv().trim().split('\n')
    expect(db.products.length).toBeGreaterThan(0)
    expect(lines).toHaveLength(db.products.length + 1)
  })
})

describe('sampleReportPdf', () => {
  it('starts with the %PDF- magic bytes and ends with %%EOF', () => {
    const bytes = sampleReportPdf()
    const text = new TextDecoder().decode(bytes)
    expect(text.startsWith('%PDF-')).toBe(true)
    expect(text.trimEnd().endsWith('%%EOF')).toBe(true)
  })
})

describe('echoUpload', () => {
  it('echoes fileName, sizeBytes and contentType for small files', () => {
    const file = new File(['hi'], 'a.txt', { type: 'text/plain' })
    expect(echoUpload(file)).toEqual({ fileName: 'a.txt', sizeBytes: 2, contentType: 'text/plain' })
  })

  it('rejects files over 1 MB with a 400 VALIDATION_ERROR', () => {
    const big = new File([new Uint8Array(1024 * 1024 + 1)], 'big.bin', {
      type: 'application/octet-stream',
    })
    let caught: unknown
    try {
      echoUpload(big)
    } catch (error) {
      caught = error
    }
    expect(caught).toBeInstanceOf(EngineError)
    const engineError = caught as EngineError
    expect(engineError.status).toBe(400)
    expect(engineError.code).toBe('VALIDATION_ERROR')
  })

  it('rejects a missing file part', () => {
    expect(() => echoUpload(null)).toThrowError(EngineError)
  })
})

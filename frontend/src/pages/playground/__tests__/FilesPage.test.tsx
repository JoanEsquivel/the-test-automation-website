// ATDD: files page — download links carry the download attribute, uploads go
// through api.files.upload and the echo is rendered (API client mocked here;
// the engine itself is unit-tested in src/engine/__tests__/files.test.ts).
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useDifficultyStore } from '@/playground/difficulty'
import FilesPage from '../FilesPage'

const uploadMock = vi.hoisted(() =>
  vi.fn(async (file: File) => ({
    fileName: file.name,
    sizeBytes: file.size,
    contentType: file.type,
  })),
)

vi.mock('@/api/client', () => {
  class ApiError extends Error {
    readonly status: number
    readonly code: string
    constructor(status: number, code: string, message: string) {
      super(message)
      this.name = 'ApiError'
      this.status = status
      this.code = code
    }
  }
  return {
    ApiError,
    api: {
      files: {
        downloadUrl: (name: string) => `http://localhost/api/files/${name}`,
        upload: uploadMock,
      },
    },
  }
})

beforeEach(() => {
  localStorage.clear()
  useDifficultyStore.setState({ level: 'easy' })
  uploadMock.mockClear()
})

describe('FilesPage', () => {
  it('renders CSV and PDF download links with the download attribute', () => {
    render(<FilesPage />)
    const csv = screen.getByRole('link', { name: /products\.csv/i })
    expect(csv).toHaveAttribute('href', expect.stringContaining('products.csv'))
    expect(csv).toHaveAttribute('download')

    const pdf = screen.getByRole('link', { name: /sample-report\.pdf/i })
    expect(pdf).toHaveAttribute('href', expect.stringContaining('sample-report.pdf'))
    expect(pdf).toHaveAttribute('download')
  })

  it('uploads a file via the classic input and renders the server echo', async () => {
    const user = userEvent.setup()
    render(<FilesPage />)

    const file = new File(['hello'], 'notes.txt', { type: 'text/plain' })
    await user.upload(screen.getByLabelText(/choose a file/i), file)

    const echo = await screen.findByTestId('files-upload-echo')
    expect(echo).toHaveTextContent('notes.txt')
    expect(echo).toHaveTextContent('5')
    expect(echo).toHaveTextContent('text/plain')
    expect(uploadMock).toHaveBeenCalledOnce()
  })

  it('shows the API error message when the upload is rejected', async () => {
    const { ApiError } = await import('@/api/client')
    uploadMock.mockRejectedValueOnce(
      new ApiError(400, 'VALIDATION_ERROR', 'File is larger than the 1 MB limit.'),
    )
    const user = userEvent.setup()
    render(<FilesPage />)

    const file = new File(['x'], 'big.bin', { type: 'application/octet-stream' })
    await user.upload(screen.getByLabelText(/choose a file/i), file)

    expect(await screen.findByTestId('files-upload-error')).toHaveTextContent(/1 MB limit/i)
  })
})

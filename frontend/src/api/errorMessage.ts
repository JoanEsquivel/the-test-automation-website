import { ApiError } from './client'

/** Human-readable message for anything a failed request can throw.
 * `ApiError` already carries the server-provided message; network failures do not. */
export function errorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error && error.message) return error.message
  return fallback
}

/** The contract error code, when the failure came from the API. */
export function errorCode(error: unknown): string | null {
  return error instanceof ApiError ? error.code : null
}

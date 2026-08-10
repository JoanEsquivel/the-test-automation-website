/** Engine-side twin of the backend's ApiError: same status/code/message triple. */
export class EngineError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'EngineError'
    this.status = status
    this.code = code
  }
}

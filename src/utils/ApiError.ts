/**
 * src/utils/ApiError.ts
 *
 * Custom operational error class.
 * "Operational" errors are expected failures (404, 401, 400, etc.)
 * as opposed to programmer errors which should crash the process.
 */
export class ApiError extends Error {
  readonly statusCode: number
  readonly isOperational: boolean

  constructor (statusCode: number, message: string, isOperational = true) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype)
    Error.captureStackTrace(this, this.constructor)
  }

  static badRequest (message: string): ApiError {
    return new ApiError(400, message)
  }

  static unauthorized (message = 'Unauthorized'): ApiError {
    return new ApiError(401, message)
  }

  static forbidden (message = 'Forbidden'): ApiError {
    return new ApiError(403, message)
  }

  static notFound (message = 'Resource not found'): ApiError {
    return new ApiError(404, message)
  }

  static conflict (message: string): ApiError {
    return new ApiError(409, message)
  }

  static internal (message = 'Internal server error'): ApiError {
    return new ApiError(500, message, false)
  }
}

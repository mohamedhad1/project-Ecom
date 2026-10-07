/**
 * src/middleware/error.middleware.ts
 *
 * Centralized error handler — MUST be registered last in Express middleware chain.
 *
 * Handles:
 *  - ApiError (our operational errors: 400, 401, 403, 404, 409...)
 *  - Mongoose ValidationError
 *  - Mongoose CastError (invalid ObjectId)
 *  - Mongoose duplicate key error (code 11000)
 *  - JWT errors (handled in auth middleware, but caught here as fallback)
 *  - Unexpected errors (500)
 *
 * In production, never exposes stack traces or internal error details.
 */

import type { Request, Response, NextFunction } from 'express'
import mongoose from 'mongoose'
import { ApiError } from '../utils/ApiError.js'
import { errorResponse } from '../utils/ApiResponse.js'

const IS_PRODUCTION = process.env.NODE_ENV === 'production'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorMiddleware (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  // ── Our own operational errors ──────────────────────────────────────────────
  if (err instanceof ApiError) {
    res.status(err.statusCode).json(errorResponse(err.message))
    return
  }

  // ── Mongoose: invalid ObjectId (e.g. GET /api/products/not-an-id) ──────────
  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json(errorResponse('Invalid ID format'))
    return
  }

  // ── Mongoose: schema validation errors ──────────────────────────────────────
  if (err instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(err.errors).map((e) => e.message)
    res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: messages,
    })
    return
  }

  // ── MongoDB: duplicate key (e.g. duplicate slug or email) ───────────────────
  if (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: number }).code === 11000
  ) {
    const keyValue = (err as { keyValue?: Record<string, unknown> }).keyValue ?? {}
    const field = Object.keys(keyValue)[0] ?? 'field'
    res.status(409).json(errorResponse(`A record with this ${field} already exists`))
    return
  }

  // ── Unexpected / programmer errors ──────────────────────────────────────────
  const message = err instanceof Error ? err.message : 'An unexpected error occurred'

  if (!IS_PRODUCTION) {
    // Show full error details in development
    res.status(500).json({
      success: false,
      message,
      stack: err instanceof Error ? err.stack : undefined,
    })
  } else {
    // Never expose internals in production
    console.error('[error]', err)
    res.status(500).json(errorResponse('Internal server error'))
  }
}

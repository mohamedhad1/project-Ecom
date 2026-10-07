/**
 * src/controllers/auth.controller.ts
 *
 * HTTP layer for auth endpoints.
 * Thin: reads credentials → calls service → sends response.
 */

/// <reference path="../types/express.d.ts" />
import type { Request, Response, NextFunction } from 'express'
import { validationResult } from 'express-validator'
import { loginAdmin } from '../services/auth.service.js'
import { successResponse } from '../utils/ApiResponse.js'

export async function login (req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map((e) => ({ field: e.type === 'field' ? e.path : e.type, message: e.msg })),
      })
      return
    }

    const { email, password } = req.body as { email: string; password: string }

    const result = await loginAdmin(email, password)

    res.json(successResponse(result, 'Login successful'))
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/auth/me  [Admin]
 * Returns the currently authenticated admin's info.
 * The token itself is not re-issued — client should handle expiry.
 */
export function getMe (req: Request, res: Response): void {
  res.json(successResponse(req.admin, 'Authenticated'))
}

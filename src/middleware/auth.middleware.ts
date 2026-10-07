/**
 * src/middleware/auth.middleware.ts
 *
 * JWT verification middleware.
 * Reads the Authorization: Bearer <token> header, verifies the token,
 * and attaches the decoded admin payload to req.admin.
 *
 * Usage: apply to any route that requires admin authentication.
 */

import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { ApiError } from '../utils/ApiError.js'
import { errorResponse } from '../utils/ApiResponse.js'

interface JwtAdminPayload {
  id: string
  email: string
}

const JWT_SECRET = process.env.JWT_SECRET

export function verifyToken (req: Request, res: Response, next: NextFunction): void {
  try {
    if (!JWT_SECRET) {
      throw ApiError.internal('JWT_SECRET is not configured')
    }

    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Authorization header missing or malformed. Use: Bearer <token>')
    }

    const token = authHeader.slice(7) // Remove 'Bearer '

    const decoded = jwt.verify(token, JWT_SECRET) as JwtAdminPayload

    if (!decoded.id || !decoded.email) {
      throw ApiError.unauthorized('Invalid token payload')
    }

    req.admin = { id: decoded.id, email: decoded.email }
    next()
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json(errorResponse('Token has expired. Please log in again.'))
      return
    }
    if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).json(errorResponse('Invalid token.'))
      return
    }
    next(err)
  }
}

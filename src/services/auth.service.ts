/**
 * src/services/auth.service.ts
 *
 * Authentication business logic.
 * Handles credential verification and JWT generation.
 * Passwords are NEVER compared in plain text.
 */

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { connectDatabase } from '../config/database.js'
import { Admin } from '../models/Admin.js'
import { ApiError } from '../utils/ApiError.js'

// ── Token payload ─────────────────────────────────────────────────────────────

export interface AdminTokenPayload {
  id: string
  email: string
}

export interface LoginResult {
  token: string
  admin: {
    id: string
    email: string
  }
  expiresIn: string
}

// ── Service functions ─────────────────────────────────────────────────────────

/**
 * Verify admin credentials and return a signed JWT.
 *
 * Uses a constant-time bcrypt comparison to prevent timing attacks.
 * Returns the SAME generic error for wrong email AND wrong password
 * to avoid leaking which field was incorrect (user enumeration).
 */
export async function loginAdmin (
  email: string,
  password: string,
): Promise<LoginResult> {
  await connectDatabase()

  const JWT_SECRET = process.env.JWT_SECRET
  const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '7d'

  if (!JWT_SECRET) {
    throw ApiError.internal('JWT_SECRET is not configured')
  }

  // Use +select('+passwordHash') because the field has select: false
  const admin = await Admin.findOne({ email: email.toLowerCase().trim() })
    .select('+passwordHash')

  // Use a dummy compare if admin not found to prevent timing attacks
  const passwordHash = admin?.passwordHash ?? '$2a$12$dummyhashtopreventtimingattacks'
  const isPasswordValid = await bcrypt.compare(password, passwordHash)

  if (!admin || !isPasswordValid) {
    // Same generic message for both wrong email and wrong password
    throw ApiError.unauthorized('Invalid credentials')
  }

  const payload: AdminTokenPayload = {
    id: (admin._id as unknown as { toString(): string }).toString(),
    email: admin.email,
  }

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  })

  return {
    token,
    admin: {
      id: payload.id,
      email: payload.email,
    },
    expiresIn: JWT_EXPIRES_IN,
  }
}

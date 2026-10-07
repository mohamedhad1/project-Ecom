/**
 * src/routes/auth.routes.ts
 *
 * Auth API routes.
 *
 *   POST /api/auth/login   — admin login, returns JWT
 *   GET  /api/auth/me      — verify token + return admin info (protected)
 */

import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { verifyToken } from '../middleware/auth.middleware.js'
import { login, getMe } from '../controllers/auth.controller.js'
import { validateLogin } from '../validators/auth.validator.js'

const router = Router()

/**
 * Rate limiter for the login endpoint.
 *
 * Limits to 10 login attempts per 15 minutes per IP.
 * Provides per-instance protection on Vercel (stateless across invocations).
 * For stronger rate limiting across serverless instances, a Redis store
 * (e.g. @upstash/ratelimit) can be added later.
 */
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// ── Routes ────────────────────────────────────────────────────────────────────

router.post('/login', loginRateLimiter, validateLogin, login)
router.get('/me', verifyToken, getMe)

export default router

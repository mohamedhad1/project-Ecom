/**
 * src/types/express.d.ts
 * Augments the Express Request type to include the authenticated admin payload.
 * Set by auth.middleware.ts after JWT verification.
 */
declare namespace Express {
  interface Request {
    admin?: {
      id: string
      email: string
    }
  }
}

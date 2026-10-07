/**
 * src/config/database.ts
 *
 * Mongoose connection with a serverless-safe singleton pattern.
 *
 * Why a singleton?
 * Vercel serverless functions can be re-invoked on the same Node.js process
 * (warm start). If we call mongoose.connect() on every request we'd open
 * a new connection pool each time. The cached promise ensures we reuse
 * an existing connection when the runtime is already warm.
 */

import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error(
    '[database] MONGODB_URI is not defined. ' +
    'Add it to your .env file (local) or Vercel environment variables (production).'
  )
}

// ── Serverless connection cache ───────────────────────────────────────────────

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

// Use a global variable so the cache survives hot-reloads in development
// and warm starts in Vercel serverless functions.
declare global {
  // eslint-disable-next-line no-var
  var __mongooseCache: MongooseCache | undefined
}

const cached: MongooseCache = global.__mongooseCache ?? { conn: null, promise: null }
global.__mongooseCache = cached

// ── Connect function ─────────────────────────────────────────────────────────

export async function connectDatabase (): Promise<typeof mongoose> {
  // Already connected — return the existing connection immediately
  if (cached.conn) {
    return cached.conn
  }

  // Connection in progress — wait for the existing promise
  if (!cached.promise) {
    const options: mongoose.ConnectOptions = {
      bufferCommands: false, // fail fast instead of buffering when not connected
    }

    cached.promise = mongoose
      .connect(MONGODB_URI as string, options)
      .then((mongooseInstance) => {
        console.log('[database] ✅ Connected to MongoDB Atlas')
        return mongooseInstance
      })
      .catch((err: Error) => {
        // Reset cache on failure so the next request can retry
        cached.promise = null
        console.error('[database] ❌ Connection failed:', err.message)
        throw err
      })
  }

  cached.conn = await cached.promise
  return cached.conn
}

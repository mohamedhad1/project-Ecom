/**
 * seed-admin.ts
 *
 * One-time script to create the initial admin account in MongoDB.
 *
 * Usage:
 *   pnpm run seed:admin
 *
 * Required environment variables (in .env):
 *   MONGODB_URI    — MongoDB Atlas connection string
 *   ADMIN_EMAIL    — Email address for the admin account
 *   ADMIN_PASSWORD — Plain-text password (will be hashed, never stored raw)
 *
 * Safety:
 *   - Checks if admin already exists before creating.
 *   - Password is hashed with bcrypt (cost factor 12) before saving.
 *   - Plain-text credentials are never logged.
 *   - Script exits cleanly after seeding (does not run on Vercel).
 */

import 'dotenv/config'
import mongoose, { Schema } from 'mongoose'
import bcrypt from 'bcryptjs'

// ── Validate required environment variables ─────────────────────────────────

const MONGODB_URI = process.env.MONGODB_URI
const ADMIN_EMAIL = process.env.ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

if (!MONGODB_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error(
    '\n[seed-admin] ❌  Missing required environment variables.\n' +
    '  Make sure your .env file contains:\n' +
    '    MONGODB_URI\n' +
    '    ADMIN_EMAIL\n' +
    '    ADMIN_PASSWORD\n'
  )
  process.exit(1)
}

// ── Minimal Admin schema (mirrors src/models/Admin.ts) ──────────────────────

const adminSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

const Admin = mongoose.models['Admin'] || mongoose.model('Admin', adminSchema)

// ── Main seeding function ────────────────────────────────────────────────────

async function seedAdmin (): Promise<void> {
  console.log('\n[seed-admin] Connecting to MongoDB Atlas...')

  await mongoose.connect(MONGODB_URI as string)

  console.log('[seed-admin] Connected.')

  const normalizedEmail = (ADMIN_EMAIL as string).toLowerCase().trim()

  // Check if admin already exists
  const existing = await Admin.findOne({ email: normalizedEmail })

  if (existing) {
    console.log(`[seed-admin] ℹ️  Admin already exists for: ${normalizedEmail}`)
    console.log('[seed-admin] Nothing was changed. Exiting.')
    await mongoose.disconnect()
    return
  }

  // Hash password — cost factor 12 is strong and reasonable
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD as string, 12)

  await Admin.create({
    email: normalizedEmail,
    passwordHash,
  })

  console.log(`[seed-admin] ✅  Admin created successfully.`)
  console.log(`[seed-admin]    Email: ${normalizedEmail}`)
  console.log(`[seed-admin]    (password stored as bcrypt hash — plain text never saved)`)
  console.log('[seed-admin] Done. Disconnecting.')

  await mongoose.disconnect()
}

// ── Run ──────────────────────────────────────────────────────────────────────

seedAdmin().catch((err: Error) => {
  console.error('\n[seed-admin] ❌  Seeding failed:', err.message)
  process.exit(1)
})

/**
 * src/models/Admin.ts
 *
 * Mongoose schema for the single administrator.
 * Passwords are NEVER stored in plain text — only bcrypt hashes.
 */

import mongoose, { type Document, type Model, Schema } from 'mongoose'

// ── Document interface ────────────────────────────────────────────────────────

export interface IAdmin extends Document {
  email: string
  passwordHash: string
  createdAt: Date
  updatedAt: Date
}

// ── Schema ────────────────────────────────────────────────────────────────────

const adminSchema = new Schema<IAdmin>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false, // Never returned in queries by default
    },
  },
  {
    timestamps: true,
  },
)

// ── Model (singleton pattern — safe for serverless) ───────────────────────────

export const Admin: Model<IAdmin> =
  (mongoose.models['Admin'] as Model<IAdmin>) ??
  mongoose.model<IAdmin>('Admin', adminSchema)

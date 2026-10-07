/**
 * Quick MongoDB connection test — run once to verify Atlas connectivity.
 * Delete or ignore after verification.
 */
import 'dotenv/config'
import { connectDatabase } from '../src/config/database.js'
import mongoose from 'mongoose'

console.log('[test] Testing MongoDB Atlas connection...')

try {
  await connectDatabase()
  console.log('[test] ✅ Connection successful!')
  console.log('[test]    State:', mongoose.connection.readyState === 1 ? 'Connected' : 'Unknown')
  console.log('[test]    Host:', mongoose.connection.host)
  console.log('[test]    Database:', mongoose.connection.name)
  await mongoose.disconnect()
  console.log('[test] Disconnected cleanly.')
} catch (err) {
  console.error('[test] ❌ Connection failed:', (err as Error).message)
  process.exit(1)
}

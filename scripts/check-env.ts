import 'dotenv/config'

const required = ['MONGODB_URI', 'JWT_SECRET', 'JWT_EXPIRES_IN', 'NODE_ENV', 'ADMIN_EMAIL', 'ADMIN_PASSWORD']

let allPresent = true
for (const key of required) {
  const val = process.env[key]
  if (!val) {
    console.log(`MISSING: ${key}`)
    allPresent = false
  } else {
    const preview = val.length > 4 ? val.slice(0, 4) + '***' : '****'
    console.log(`OK: ${key} = ${preview}`)
  }
}

if (allPresent) {
  console.log('\n✅ All required environment variables are present.')
} else {
  console.log('\n❌ Some variables are missing — check your .env file.')
  process.exit(1)
}

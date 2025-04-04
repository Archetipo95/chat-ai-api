import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { config } from 'dotenv'

// Load env vars
config({ path: '.env' })

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  throw new Error('Missing NEON_DATABASE_URL in .env file')
}

// Init Neon client
const sql = neon(DATABASE_URL)

// Init Drizzle ORM
export const db = drizzle(sql)

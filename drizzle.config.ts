import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit'

config({ path: '.env' })

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  throw new Error('Missing NEON_DATABASE_URL in .env file')
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: DATABASE_URL,
  },
})

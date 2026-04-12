/** Drizzle ORM 配置 */
import type { Config } from 'drizzle-kit'

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://fullstack:fullstack123@localhost:5433/fullstack_db',
  },
} satisfies Config

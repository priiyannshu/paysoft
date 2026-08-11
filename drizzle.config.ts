import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './app/cf-worker/db/schema.ts',
  out: './app/pipeline/migrations',
  dialect: 'sqlite',
  verbose: true,
  strict: true,
})

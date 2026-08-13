import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config'

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: {
          configPath: './wrangler.jsonc',
        },
      },
    },
    server: {
      deps: {
        inline: [/@lucia-auth/, /lucia/, /drizzle-orm/, /drizzle-kit/],
      },
    },
    include: ['app/**/*.test.ts'],
  },
})

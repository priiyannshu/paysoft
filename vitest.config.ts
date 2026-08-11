import { defineConfig } from '@cloudflare/vitest-pool-workers/config'

export default defineConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: {
          configPath: './wrangler.jsonc',
        },
      },
    },
  },
})

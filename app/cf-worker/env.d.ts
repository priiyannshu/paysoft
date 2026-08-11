declare module 'cloudflare:test' {
  interface ProvidedEnv {
    DB: D1Database
  }
}

interface Env {
  DB: D1Database
  ASSETS: Fetcher
}

import type { D1Database, Fetcher, R2Bucket, VectorizeIndex, Queue, DurableObjectNamespace } from '@cloudflare/workers-types'

declare module 'cloudflare:test' {
  interface ProvidedEnv {
    DB: D1Database
    ASSETS: Fetcher
    BUCKET?: R2Bucket
    PAYROLL_LOCK: DurableObjectNamespace
    PAYSLIP_QUEUE?: Queue<any>
    NOTIFY_QUEUE?: Queue<any>
    VECTORIZE_INDEX?: VectorizeIndex
    AI?: any
    SEND_EMAIL?: any
    SENDER_EMAIL_ADDRESS?: string
  }
}

interface Env {
  DB: D1Database
  ASSETS: Fetcher
  BUCKET?: R2Bucket
  PAYROLL_LOCK: DurableObjectNamespace
  PAYSLIP_QUEUE?: Queue<any>
  NOTIFY_QUEUE?: Queue<any>
  VECTORIZE_INDEX?: VectorizeIndex
  AI?: any
  SEND_EMAIL?: any
  SENDER_EMAIL_ADDRESS?: string
}

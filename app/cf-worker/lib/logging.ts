import { Context, Next } from 'hono';

export interface LogPayload {
  event: string;
  level: 'info' | 'warn' | 'error';
  traceId: string;
  orgId?: string;
  userId?: string;
  durationMs?: number;
  meta?: Record<string, any>;
}

export function log(payload: LogPayload) {
  console.log(JSON.stringify({ ...payload, timestamp: new Date().toISOString() }));
}

export async function traceIdMiddleware(c: Context, next: Next) {
  const traceId = crypto.randomUUID();
  c.set('traceId', traceId);
  c.header('X-Trace-Id', traceId);

  const start = Date.now();
  await next();
  const durationMs = Date.now() - start;

  // Optional: log request access here
  // log({ event: 'http.request', level: 'info', traceId, durationMs, meta: { method: c.req.method, url: c.req.url } });
}

export async function errorBoundaryMiddleware(err: Error, c: Context) {
  const traceId = c.get('traceId') || crypto.randomUUID();
  
  log({
    event: 'unhandled_exception',
    level: 'error',
    traceId,
    meta: {
      message: err.message,
      stack: err.stack,
      url: c.req.url,
      method: c.req.method,
    }
  });

  return c.json({
    type: "about:blank",
    title: "Internal Server Error",
    status: 500,
    detail: "An unexpected error occurred. Please quote this trace ID to support.",
    traceId: traceId
  }, 500);
}

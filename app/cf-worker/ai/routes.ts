import { Hono } from 'hono'
import { streamChatResponse, retrieveComplianceContext } from './rag'

export const aiRoutes = new Hono<{ Bindings: Env }>()

/**
 * POST /api/ai/chat
 * Server-Sent Events (SSE) streaming endpoint for statutory chatbot
 */
aiRoutes.post('/chat', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as {
    message?: string
    query?: string
    history?: any[]
    orgId?: string
  }

  const query = body.message || body.query || ''
  if (!query.trim()) {
    return c.json({ error: 'Message query cannot be empty' }, 400)
  }

  return streamChatResponse(query, body.history || [], c.env)
})

/**
 * GET /api/ai/search
 * Non-streaming knowledge base search endpoint
 */
aiRoutes.get('/search', async (c) => {
  const query = c.req.query('q') || 'tax'
  const limit = parseInt(c.req.query('limit') || '3', 10)
  const results = await retrieveComplianceContext(query, c.env, limit)

  return c.json({
    query,
    count: results.length,
    results,
  })
})

/**
 * GET /api/ai/status
 */
aiRoutes.get('/status', (c) => {
  return c.json({
    ok: true,
    service: 'PaySoft AI Statutory Assistant',
    model: '@cf/meta/llama-3-8b-instruct',
    embeddingModel: '@cf/baai/bge-base-en-v1.5',
    vectorizeIndex: 'paysoft-tax-kb',
    aiBound: !!c.env.AI,
  })
})

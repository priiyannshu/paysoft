import { Hono } from 'hono'
import { computeDeductions, simulateRegimes } from './engine'
import {
  getCachedTaxSlabs,
  updateCachedTaxSlabs,
  getCachedPTaxRules,
  getCachedStatutoryConfig,
  type TaxSlabsConfig,
  type StatutoryConfig,
} from './cache'
import { setCache, CACHE_KEYS, CACHE_TTLS } from '../../cache/kv'
import type { TaxCalculationInput, PTaxSlab } from './types'

interface TaxEnv {
  Bindings: {
    DB?: D1Database
    KV?: KVNamespace
  }
}

const tax = new Hono<TaxEnv>()

tax.post('/calculate', async (c) => {
  const input = await c.req.json<TaxCalculationInput>()
  const result = computeDeductions(input)
  return c.json(result)
})

tax.post('/simulate', async (c) => {
  const input = await c.req.json<TaxCalculationInput>()
  const result = simulateRegimes(input)
  return c.json(result)
})

/**
 * GET /tax/slabs/:fy
 * Retrieve cached Income Tax slabs (24h TTL)
 */
tax.get('/slabs/:fy', async (c) => {
  const fy = c.req.param('fy') || '2025-2026'
  const config = await getCachedTaxSlabs(c.env.KV, fy, c.env.DB)
  return c.json(config)
})

/**
 * POST /tax/slabs/:fy
 * Write-through update of Income Tax slabs in KV & D1
 */
tax.post('/slabs/:fy', async (c) => {
  const fy = c.req.param('fy') || '2025-2026'
  const body = await c.req.json<Partial<TaxSlabsConfig>>()
  const current = await getCachedTaxSlabs(c.env.KV, fy, c.env.DB)
  const updated: TaxSlabsConfig = {
    ...current,
    ...body,
    financialYear: fy,
  }

  await updateCachedTaxSlabs(c.env.KV, updated, c.env.DB)
  return c.json({ ok: true, slabs: updated })
})

/**
 * GET /tax/ptax/:state
 * Retrieve cached PTax slabs for a state (7d TTL)
 */
tax.get('/ptax/:state', async (c) => {
  const state = c.req.param('state') || 'MH'
  const rules = await getCachedPTaxRules(c.env.KV, state, c.env.DB)
  return c.json({ state: state.toUpperCase(), slabs: rules })
})

/**
 * POST /tax/ptax/:state
 * Update PTax slabs with KV write-through
 */
tax.post('/ptax/:state', async (c) => {
  const state = (c.req.param('state') || 'MH').toUpperCase()
  const slabs = await c.req.json<PTaxSlab[]>()

  if (c.env.DB) {
    await c.env.DB.prepare(
      `INSERT INTO configurations (id, org_id, key, value, description, updated_at)
       VALUES (?, 'GLOBAL', ?, ?, 'State PTax slabs', unixepoch())
       ON CONFLICT(org_id, key) DO UPDATE SET value = excluded.value, updated_at = unixepoch()`
    ).bind(
      crypto.randomUUID(),
      `ptax_rules_${state}`,
      JSON.stringify(slabs)
    ).run()
  }

  await setCache(c.env.KV, CACHE_KEYS.ptaxRules(state), slabs, CACHE_TTLS.PTAX_RULES)
  return c.json({ ok: true, state, slabs })
})

/**
 * GET /tax/config/:orgId
 * Retrieve cached statutory parameters (PF/ESI ceilings) for an org (7d TTL)
 */
tax.get('/config/:orgId', async (c) => {
  const orgId = c.req.param('orgId') || 'org_demo_001'
  const config = await getCachedStatutoryConfig(c.env.KV, orgId, c.env.DB)
  return c.json(config)
})

/**
 * POST /tax/config/:orgId
 * Update statutory configuration with KV write-through
 */
tax.post('/config/:orgId', async (c) => {
  const orgId = c.req.param('orgId') || 'org_demo_001'
  const body = await c.req.json<Partial<StatutoryConfig>>()
  const current = await getCachedStatutoryConfig(c.env.KV, orgId, c.env.DB)
  const updated: StatutoryConfig = {
    ...current,
    ...body,
    orgId,
    updatedAt: new Date().toISOString(),
  }

  if (c.env.DB) {
    await c.env.DB.prepare(
      `INSERT INTO configurations (id, org_id, key, value, description, updated_at)
       VALUES (?, ?, 'statutory_config', ?, 'Organization statutory configuration', unixepoch())
       ON CONFLICT(org_id, key) DO UPDATE SET value = excluded.value, updated_at = unixepoch()`
    ).bind(
      crypto.randomUUID(),
      orgId,
      JSON.stringify(updated)
    ).run()
  }

  await setCache(c.env.KV, CACHE_KEYS.statutoryConfig(orgId), updated, CACHE_TTLS.STATUTORY_CONFIG)
  return c.json({ ok: true, config: updated })
})

export { tax }

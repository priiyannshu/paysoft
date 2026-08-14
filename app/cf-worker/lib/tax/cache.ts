import type { KVNamespace, D1Database } from '@cloudflare/workers-types'
import { getCached, setCache, CACHE_KEYS, CACHE_TTLS } from '../../cache/kv'
import {
  OLD_REGIME_SLABS,
  NEW_REGIME_SLABS,
  SURCHARGE_SLABS_OLD,
  SURCHARGE_SLABS_NEW,
  CESS_RATE,
  STANDARD_DEDUCTION_OLD,
  STANDARD_DEDUCTION_NEW,
  SECTION_87A_LIMIT_OLD,
  SECTION_87A_REBATE_OLD,
  SECTION_87A_LIMIT_NEW,
  SECTION_87A_REBATE_NEW,
  SECTION_80C_CAP,
} from './slabs'
import { STATE_PTAX_SLABS } from './ptax'
import type { PTaxSlab, TaxSlab } from './types'

export interface TaxSlabsConfig {
  financialYear: string
  oldRegimeSlabs: TaxSlab[]
  newRegimeSlabs: TaxSlab[]
  surchargeOld: TaxSlab[]
  surchargeNew: TaxSlab[]
  cessRate: number
  standardDeductionOld: number
  standardDeductionNew: number
  section87aLimitOld: number
  section87aRebateOld: number
  section87aLimitNew: number
  section87aRebateNew: number
  section80cCap: number
}

export interface StatutoryConfig {
  orgId: string
  epfWageCeiling: number
  epfEmployeeRate: number
  epsEmployerRate: number
  epfEmployerRate: number
  esiWageCeiling: number
  esiEmployeeRate: number
  esiEmployerRate: number
  updatedAt: string
}

export const DEFAULT_TAX_CONFIG_2025_26: TaxSlabsConfig = {
  financialYear: '2025-2026',
  oldRegimeSlabs: OLD_REGIME_SLABS,
  newRegimeSlabs: NEW_REGIME_SLABS,
  surchargeOld: SURCHARGE_SLABS_OLD,
  surchargeNew: SURCHARGE_SLABS_NEW,
  cessRate: CESS_RATE,
  standardDeductionOld: STANDARD_DEDUCTION_OLD,
  standardDeductionNew: STANDARD_DEDUCTION_NEW,
  section87aLimitOld: SECTION_87A_LIMIT_OLD,
  section87aRebateOld: SECTION_87A_REBATE_OLD,
  section87aLimitNew: SECTION_87A_LIMIT_NEW,
  section87aRebateNew: SECTION_87A_REBATE_NEW,
  section80cCap: SECTION_80C_CAP,
}

export const DEFAULT_STATUTORY_CONFIG: Omit<StatutoryConfig, 'orgId' | 'updatedAt'> = {
  epfWageCeiling: 15000,
  epfEmployeeRate: 0.12,
  epsEmployerRate: 0.0833,
  epfEmployerRate: 0.0367,
  esiWageCeiling: 21000,
  esiEmployeeRate: 0.0075,
  esiEmployerRate: 0.0325,
}

/**
 * Fetch and cache Income Tax slabs for a given Financial Year (24-hour TTL).
 */
export async function getCachedTaxSlabs(
  kv: KVNamespace | undefined | null,
  financialYear = '2025-2026',
  db?: D1Database
): Promise<TaxSlabsConfig> {
  const key = CACHE_KEYS.taxSlabs(financialYear)

  return getCached<TaxSlabsConfig>(kv, key, CACHE_TTLS.TAX_SLABS, async () => {
    if (db) {
      try {
        const row = await db.prepare(
          `SELECT value FROM configurations WHERE key = ? LIMIT 1`
        ).bind(`tax_slabs_${financialYear}`).first<{ value: string }>()

        if (row && row.value) {
          return JSON.parse(row.value) as TaxSlabsConfig
        }
      } catch (err) {
        console.warn(`[Tax Cache] DB fallback error for tax slabs:`, err)
      }
    }
    return { ...DEFAULT_TAX_CONFIG_2025_26, financialYear }
  })
}

/**
 * Write-through / update Tax Slabs in KV & DB.
 */
export async function updateCachedTaxSlabs(
  kv: KVNamespace | undefined | null,
  config: TaxSlabsConfig,
  db?: D1Database
): Promise<void> {
  const key = CACHE_KEYS.taxSlabs(config.financialYear)

  if (db) {
    await db.prepare(
      `INSERT INTO configurations (id, org_id, key, value, description, updated_at)
       VALUES (?, 'GLOBAL', ?, ?, 'Statutory tax slabs configuration', unixepoch())
       ON CONFLICT(org_id, key) DO UPDATE SET value = excluded.value, updated_at = unixepoch()`
    ).bind(
      crypto.randomUUID(),
      `tax_slabs_${config.financialYear}`,
      JSON.stringify(config)
    ).run()
  }

  await setCache(kv, key, config, CACHE_TTLS.TAX_SLABS)
}

/**
 * Fetch and cache State PTax Slabs (7-day TTL).
 */
export async function getCachedPTaxRules(
  kv: KVNamespace | undefined | null,
  state = 'MH',
  db?: D1Database
): Promise<PTaxSlab[]> {
  const stateCode = state.toUpperCase()
  const key = CACHE_KEYS.ptaxRules(stateCode)

  return getCached<PTaxSlab[]>(kv, key, CACHE_TTLS.PTAX_RULES, async () => {
    if (db) {
      try {
        const row = await db.prepare(
          `SELECT value FROM configurations WHERE key = ? LIMIT 1`
        ).bind(`ptax_rules_${stateCode}`).first<{ value: string }>()

        if (row && row.value) {
          return JSON.parse(row.value) as PTaxSlab[]
        }
      } catch (err) {
        console.warn(`[PTax Cache] DB fallback error for PTax rules:`, err)
      }
    }
    return STATE_PTAX_SLABS[stateCode] || []
  })
}

/**
 * Fetch and cache PF/ESI Statutory Config for an Organization (7-day TTL).
 */
export async function getCachedStatutoryConfig(
  kv: KVNamespace | undefined | null,
  orgId = 'org_demo_001',
  db?: D1Database
): Promise<StatutoryConfig> {
  const key = CACHE_KEYS.statutoryConfig(orgId)

  return getCached<StatutoryConfig>(kv, key, CACHE_TTLS.STATUTORY_CONFIG, async () => {
    if (db) {
      try {
        const row = await db.prepare(
          `SELECT value FROM configurations WHERE org_id = ? AND key = 'statutory_config' LIMIT 1`
        ).bind(orgId).first<{ value: string }>()

        if (row && row.value) {
          return JSON.parse(row.value) as StatutoryConfig
        }
      } catch (err) {
        console.warn(`[Statutory Config Cache] DB lookup error:`, err)
      }
    }

    return {
      orgId,
      ...DEFAULT_STATUTORY_CONFIG,
      updatedAt: new Date().toISOString(),
    }
  })
}

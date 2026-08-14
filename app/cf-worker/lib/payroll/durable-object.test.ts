import { describe, it, expect, beforeEach } from 'vitest'
import { PayrollRunLock } from './durable-object'

// In-memory mock for DurableObjectState & storage
function createMockDOState(): DurableObjectState {
  const map = new Map<string, any>()
  const storage = {
    get: async <T = any>(key: string): Promise<T | undefined> => map.get(key),
    put: async (key: string, value: any): Promise<void> => {
      map.set(key, value)
    },
    delete: async (key: string): Promise<boolean> => map.delete(key),
    deleteAll: async (): Promise<void> => map.clear(),
  } as unknown as DurableObjectStorage

  return {
    storage,
    blockConcurrencyWhile: async (fn: () => Promise<void>) => await fn(),
    id: { toString: () => 'mock-do-id' } as any,
    waitUntil: () => {},
  } as unknown as DurableObjectState
}

describe('PayrollRunLock Durable Object Progress Tracking', () => {
  let state: DurableObjectState
  let lock: PayrollRunLock

  beforeEach(() => {
    state = createMockDOState()
    lock = new PayrollRunLock(state, {})
  })

  it('initializes with unheld lock and null progress', async () => {
    const res = await lock.fetch(new Request('https://lock/status'))
    expect(res.status).toBe(200)
    const data = await res.json() as any
    expect(data.held).toBe(false)
    expect(data.progress).toBeNull()
  })

  it('acquires lock and initializes progress tracking', async () => {
    const acquireRes = await lock.fetch(new Request('https://lock/acquire', {
      method: 'POST',
      body: JSON.stringify({
        orgId: 'org_001',
        month: 3,
        year: 2026,
        runId: 'PR-org_001-2026-03-001',
        totalEmployees: 100,
      }),
      headers: { 'Content-Type': 'application/json' },
    }))

    expect(acquireRes.status).toBe(200)
    const data = await acquireRes.json() as any
    expect(data.acquired).toBe(true)
    expect(data.runId).toBe('PR-org_001-2026-03-001')
    expect(data.progress.totalEmployees).toBe(100)
    expect(data.progress.processedEmployees).toBe(0)
    expect(data.progress.currentStage).toBe('initiating')
    expect(data.progress.percentComplete).toBe(0)
    expect(data.progress.errors).toEqual([])
  })

  it('rejects concurrent acquire with 409', async () => {
    await lock.fetch(new Request('https://lock/acquire', {
      method: 'POST',
      body: JSON.stringify({
        orgId: 'org_001',
        month: 3,
        year: 2026,
        runId: 'PR-1',
        totalEmployees: 50,
      }),
    }))

    const concurrentRes = await lock.fetch(new Request('https://lock/acquire', {
      method: 'POST',
      body: JSON.stringify({
        orgId: 'org_001',
        month: 3,
        year: 2026,
        runId: 'PR-2',
        totalEmployees: 50,
      }),
    }))

    expect(concurrentRes.status).toBe(409)
    const err = await concurrentRes.json() as any
    expect(err.error).toBe('Lock already held')
    expect(err.runId).toBe('PR-1')
  })

  it('updates stages, processed count, and percent complete incrementally', async () => {
    await lock.fetch(new Request('https://lock/acquire', {
      method: 'POST',
      body: JSON.stringify({
        orgId: 'org_001',
        month: 3,
        year: 2026,
        runId: 'PR-1',
        totalEmployees: 200,
      }),
    }))

    // Stage 1: calculating_tax with 50 processed
    let updateRes = await lock.fetch(new Request('https://lock/progress/update', {
      method: 'POST',
      body: JSON.stringify({
        currentStage: 'calculating_tax',
        processedEmployees: 50,
      }),
    }))
    let progress = await updateRes.json() as any
    expect(progress.currentStage).toBe('calculating_tax')
    expect(progress.processedEmployees).toBe(50)
    expect(progress.percentComplete).toBe(25)

    // Stage 2: writing_records increment by 50
    updateRes = await lock.fetch(new Request('https://lock/progress/update', {
      method: 'POST',
      body: JSON.stringify({
        currentStage: 'writing_records',
        incrementProcessed: 50,
      }),
    }))
    progress = await updateRes.json() as any
    expect(progress.currentStage).toBe('writing_records')
    expect(progress.processedEmployees).toBe(100)
    expect(progress.percentComplete).toBe(50)

    // Stage 3: error logging
    updateRes = await lock.fetch(new Request('https://lock/progress/update', {
      method: 'POST',
      body: JSON.stringify({
        error: { employeeId: 'emp_999', reason: 'Invalid PAN syntax' },
      }),
    }))
    progress = await updateRes.json() as any
    expect(progress.errors.length).toBe(1)
    expect(progress.errors[0].employeeId).toBe('emp_999')
  })

  it('transitions lifecycle and marks stage completed with 100% on computed status', async () => {
    await lock.fetch(new Request('https://lock/acquire', {
      method: 'POST',
      body: JSON.stringify({
        orgId: 'org_001',
        month: 3,
        year: 2026,
        runId: 'PR-1',
        totalEmployees: 80,
      }),
    }))

    await lock.fetch(new Request('https://lock/transition', {
      method: 'POST',
      body: JSON.stringify({ nextStatus: 'processing' }),
    }))

    const transitionRes = await lock.fetch(new Request('https://lock/transition', {
      method: 'POST',
      body: JSON.stringify({ nextStatus: 'computed' }),
    }))

    expect(transitionRes.status).toBe(200)
    const result = await transitionRes.json() as any
    expect(result.status).toBe('computed')
    expect(result.progress.currentStage).toBe('completed')
    expect(result.progress.percentComplete).toBe(100)
  })

  it('releases lock and persists progress', async () => {
    await lock.fetch(new Request('https://lock/acquire', {
      method: 'POST',
      body: JSON.stringify({
        orgId: 'org_001',
        month: 3,
        year: 2026,
        runId: 'PR-1',
        totalEmployees: 10,
      }),
    }))

    const releaseRes = await lock.fetch(new Request('https://lock/release', {
      method: 'POST',
    }))
    expect(releaseRes.status).toBe(200)
    const data = await releaseRes.json() as any
    expect(data.released).toBe(true)

    const statusRes = await lock.fetch(new Request('https://lock/status'))
    const statusData = await statusRes.json() as any
    expect(statusData.held).toBe(false)
    expect(statusData.progress).toBeDefined()
  })
})

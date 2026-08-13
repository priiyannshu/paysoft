import { describe, it, expect, vi } from 'vitest'
import { ESSEngine } from '../engine'

describe('ESSEngine', () => {
  const mockDb = {
    prepare: vi.fn().mockReturnThis(),
    bind: vi.fn().mockReturnThis(),
    run: vi.fn().mockResolvedValue({ success: true }),
    all: vi.fn().mockResolvedValue({ results: [] }),
    first: vi.fn().mockResolvedValue(null),
  } as any as D1Database

  const engine = new ESSEngine(mockDb)

  it('submits a declaration successfully', async () => {
    mockDb.prepare = vi.fn().mockReturnValue({
      bind: vi.fn().mockReturnValue({
        run: vi.fn().mockResolvedValue({ success: true }),
      }),
    })

    const result = await engine.submitDeclaration(
      'decl-1',
      'EMP-1',
      '2026-2027',
      { section80C: 100000, section80D: 25000, section24b: 0, rentPaid: 50000, isMetro: true }
    )

    expect(result.id).toBe('decl-1')
    expect(result.status).toBe('submitted')
    expect(result.financialYear).toBe('2026-2027')
  })

  it('retrieves declarations', async () => {
    mockDb.prepare = vi.fn().mockReturnValue({
      bind: vi.fn().mockReturnValue({
        all: vi.fn().mockResolvedValue({
          results: [
            {
              id: 'decl-1',
              employee_id: 'EMP-1',
              financial_year: '2026-2027',
              declarations_json: JSON.stringify({ section80C: 100000 }),
              status: 'submitted',
              created_at: '2026-08-01T00:00:00.000Z',
              updated_at: '2026-08-01T00:00:00.000Z',
            },
          ],
        }),
      }),
    })

    const results = await engine.getDeclarations('EMP-1')
    expect(results).toHaveLength(1)
    expect(results[0].id).toBe('decl-1')
    expect(results[0].declarations.section80C).toBe(100000)
  })

  it('applies leave successfully if balance is sufficient', async () => {
    mockDb.prepare = vi.fn().mockImplementation((query: string) => {
      return {
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue({ balance: 10 }),
          run: vi.fn().mockResolvedValue({ success: true }),
        }),
      }
    })

    const result = await engine.applyLeave('leave-1', 'EMP-1', 'sick', '2026-08-20', '2026-08-21', 2)
    expect(result.id).toBe('leave-1')
    expect(result.status).toBe('pending')
  })

  it('rejects leave application if balance is insufficient', async () => {
    mockDb.prepare = vi.fn().mockImplementation((query: string) => {
      return {
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue({ balance: 1 }), // Only 1 day left
          run: vi.fn().mockResolvedValue({ success: true }),
        }),
      }
    })

    await expect(engine.applyLeave('leave-2', 'EMP-1', 'sick', '2026-08-20', '2026-08-21', 2))
      .rejects.toThrow('Insufficient leave balance')
  })
})

import { describe, it, expect, vi } from 'vitest'
import { handleScheduledBackup } from './backup'

describe('D1 Scheduled Backup to R2 Cron', () => {
  it('executes database snapshot export, gzip compression, and uploads to R2', async () => {
    const uploadedObjects: Record<string, { buffer: ArrayBuffer | Uint8Array; options: any }> = {}
    const auditInserts: any[] = []

    const mockBucket: any = {
      put: vi.fn(async (key: string, buffer: any, options: any) => {
        uploadedObjects[key] = { buffer, options }
        return { key, size: buffer.byteLength || buffer.length }
      }),
    }

    const mockDb: any = {
      prepare: vi.fn((query: string) => ({
        bind: vi.fn((...params: any[]) => ({
          run: vi.fn(async () => {
            if (query.includes('audit_logs')) {
              auditInserts.push({ query, params })
            }
            return { success: true }
          }),
        })),
        all: vi.fn(async () => {
          if (query.includes('organizations')) {
            return { results: [{ id: 'org_01', name: 'Acme Corp', code: 'ACME' }] }
          }
          if (query.includes('employees')) {
            return { results: [{ id: 'emp_01', org_id: 'org_01', code: 'EMP001', basic_pay: 50000 }] }
          }
          if (query.includes('salary_records')) {
            return { results: [{ id: 'sr_01', org_id: 'org_01', net_pay: 45000, status: 'frozen' }] }
          }
          return { results: [] }
        }),
      })),
    }

    const event = {
      cron: '0 2 * * *',
      scheduledTime: new Date('2026-08-14T02:00:00Z').getTime(),
    }

    const result = await handleScheduledBackup(event, {
      DB: mockDb,
      BUCKET: mockBucket,
    })

    expect(result.success).toBe(true)
    expect(result.key).toMatch(/^backups\/2026-08-14\/paysoft_d1_backup_\d+\.json(\.gz)?$/)
    expect(result.totalRecords).toBe(3)
    expect(result.counts.organizations).toBe(1)
    expect(result.counts.employees).toBe(1)
    expect(result.counts.salary_records).toBe(1)
    expect(result.byteSize).toBeGreaterThan(0)

    // Verify R2 Put was called with custom metadata
    expect(mockBucket.put).toHaveBeenCalledTimes(1)
    expect(mockBucket.put).toHaveBeenCalledWith(
      result.key,
      expect.anything(),
      expect.objectContaining({
        customMetadata: expect.objectContaining({
          backupDate: '2026-08-14',
          totalRecords: '3',
        }),
      })
    )

    // Verify audit log insert
    expect(auditInserts.length).toBe(1)
    expect(auditInserts[0].params[4]).toBe('system.backup.completed')
  })

  it('runs safely even if R2 bucket binding is omitted in test environments', async () => {
    const mockDb: any = {
      prepare: vi.fn(() => ({
        bind: vi.fn(() => ({
          run: vi.fn(async () => ({ success: true })),
        })),
        all: vi.fn(async () => ({ results: [] })),
      })),
    }

    const event = {
      cron: '0 2 * * *',
      scheduledTime: Date.now(),
    }

    const result = await handleScheduledBackup(event, {
      DB: mockDb,
    })

    expect(result.success).toBe(true)
    expect(result.totalRecords).toBe(0)
  })
})

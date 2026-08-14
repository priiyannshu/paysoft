import { describe, it, expect, vi } from 'vitest'
import { handlePayslipQueue } from './payslip-consumer'
import { handleNotifyQueue } from './notify-consumer'
import type { PayslipJobMessage, NotifyJobMessage } from './types'

function createMockMessage<T>(body: T): Message<T> {
  return {
    id: `msg-${Math.random().toString(36).substring(7)}`,
    timestamp: new Date(),
    body,
    attempts: 1,
    ack: vi.fn(),
    retry: vi.fn(),
  } as unknown as Message<T>
}

describe('Cloudflare Queues Batch Processing & Consumers', () => {
  it('processes batch of payslip jobs and writes to R2 bucket', async () => {
    const messages: Message<PayslipJobMessage>[] = [
      createMockMessage({
        jobId: 'JOB-001',
        orgId: 'org_demo_001',
        month: 3,
        year: 2026,
        employeeId: 'emp_0001',
        totalEmployees: 2,
      }),
      createMockMessage({
        jobId: 'JOB-001',
        orgId: 'org_demo_001',
        month: 3,
        year: 2026,
        employeeId: 'emp_0002',
        totalEmployees: 2,
      }),
    ]

    const batch: MessageBatch<PayslipJobMessage> = {
      queue: 'paysoft-payslip-queue',
      messages,
      ackAll: vi.fn(),
      retryAll: vi.fn(),
    }

    const r2Puts: Array<{ key: string; options?: any }> = []
    const mockR2 = {
      put: vi.fn(async (key: string, value: any, options?: any) => {
        r2Puts.push({ key, options })
      }),
    }

    const doFetches: string[] = []
    const mockDO = {
      idFromName: vi.fn(() => 'do-id'),
      get: vi.fn(() => ({
        fetch: vi.fn(async (req: Request) => {
          doFetches.push(req.url)
          return new Response(JSON.stringify({ ok: true }))
        }),
      })),
    }

    const env = {
      BUCKET: mockR2,
      PAYROLL_LOCK: mockDO,
    }

    const result = await handlePayslipQueue(batch, env)

    expect(result.processed).toBe(2)
    expect(result.failed).toBe(0)
    expect(messages[0].ack).toHaveBeenCalled()
    expect(messages[1].ack).toHaveBeenCalled()

    // Assert R2 writes occurred for both employees
    expect(mockR2.put).toHaveBeenCalledTimes(2)
    expect(r2Puts[0].key).toBe('payslips/org_demo_001/2026/03/emp_0001.html')
    expect(r2Puts[1].key).toBe('payslips/org_demo_001/2026/03/emp_0002.html')

    // Assert DO progress was updated
    expect(mockDO.idFromName).toHaveBeenCalledWith('org_demo_001:2026:3')
    expect(doFetches.length).toBeGreaterThanOrEqual(2)
  })

  it('retries payslip message on processing failure', async () => {
    const badMessage = createMockMessage({
      jobId: 'JOB-ERR',
      orgId: 'org_demo_001',
      month: 3,
      year: 2026,
      employeeId: 'emp_err',
    })

    const batch: MessageBatch<PayslipJobMessage> = {
      queue: 'paysoft-payslip-queue',
      messages: [badMessage],
      ackAll: vi.fn(),
      retryAll: vi.fn(),
    }

    const mockR2 = {
      put: vi.fn(async () => {
        throw new Error('R2 write timeout')
      }),
    }

    const env = {
      BUCKET: mockR2,
    }

    const result = await handlePayslipQueue(batch, env)

    expect(result.processed).toBe(0)
    expect(result.failed).toBe(1)
    expect(badMessage.retry).toHaveBeenCalled()
  })

  it('processes notify queue batch with audit logging', async () => {
    const notifyMessages: Message<NotifyJobMessage>[] = [
      createMockMessage({
        id: 'evt-1',
        type: 'audit',
        recipient: 'SYSTEM',
        subject: 'Payroll Run Notification',
        body: 'March 2026 payroll run completed',
        timestamp: new Date().toISOString(),
      }),
      createMockMessage({
        id: 'evt-2',
        type: 'email',
        recipient: 'priya@example.com',
        subject: 'Payslip Available',
        body: 'Your payslip for March 2026 is ready',
        timestamp: new Date().toISOString(),
      }),
    ]

    const batch: MessageBatch<NotifyJobMessage> = {
      queue: 'paysoft-notify-queue',
      messages: notifyMessages,
      ackAll: vi.fn(),
      retryAll: vi.fn(),
    }

    const mockDb = {
      prepare: vi.fn(() => ({
        bind: vi.fn(() => ({
          run: vi.fn(async () => ({ success: true })),
        })),
        run: vi.fn(async () => ({ success: true })),
      })),
    }

    const env = {
      DB: mockDb,
    }

    const result = await handleNotifyQueue(batch, env)

    expect(result.processed).toBe(2)
    expect(result.failed).toBe(0)
    expect(notifyMessages[0].ack).toHaveBeenCalled()
    expect(notifyMessages[1].ack).toHaveBeenCalled()
  })
})

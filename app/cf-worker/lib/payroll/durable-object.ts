import type { PayrollRunStatus } from './types'
import { canTransition } from './engine'

interface LockState {
  held: boolean
  orgId: string | null
  month: number | null
  year: number | null
  runId: string | null
  status: PayrollRunStatus | null
  heldAt: string | null
}

const EMPTY_STATE: LockState = {
  held: false,
  orgId: null,
  month: null,
  year: null,
  runId: null,
  status: null,
  heldAt: null,
}

/**
 * PayrollRunLock Durable Object.
 *
 * Guarantees only one payroll run can execute per org+month at a time.
 * The DO is keyed by `${orgId}:${year}:${month}` in the binding namespace.
 *
 * Endpoints:
 *   POST /acquire  — attempt to acquire the lock for a payroll run
 *   POST /release  — release the lock after the run completes
 *   GET  /status   — check current lock state and lifecycle status
 *   POST /transition — advance the lifecycle state machine
 */
export class PayrollRunLock implements DurableObject {
  private state: DurableObjectState
  private lock: LockState = { ...EMPTY_STATE }

  constructor(state: DurableObjectState, _env: unknown) {
    this.state = state
    this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get<LockState>('lock')
      if (stored) this.lock = stored
    })
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname

    if (request.method === 'POST' && path === '/acquire') {
      return this.acquire(request)
    }
    if (request.method === 'POST' && path === '/release') {
      return this.release()
    }
    if (request.method === 'GET' && path === '/status') {
      return this.getStatus()
    }
    if (request.method === 'POST' && path === '/transition') {
      return this.transition(request)
    }

    return new Response('Not Found', { status: 404 })
  }

  private async acquire(request: Request): Promise<Response> {
    if (this.lock.held) {
      return Response.json(
        { error: 'Lock already held', runId: this.lock.runId, heldAt: this.lock.heldAt },
        { status: 409 }
      )
    }

    const body = await request.json() as { orgId: string; month: number; year: number; runId: string }

    this.lock = {
      held: true,
      orgId: body.orgId,
      month: body.month,
      year: body.year,
      runId: body.runId,
      status: 'draft',
      heldAt: new Date().toISOString(),
    }

    await this.state.storage.put('lock', this.lock)
    return Response.json({ acquired: true, runId: body.runId })
  }

  private async release(): Promise<Response> {
    if (!this.lock.held) {
      return Response.json({ error: 'No lock held' }, { status: 400 })
    }

    const releasedRunId = this.lock.runId
    this.lock = { ...EMPTY_STATE }
    await this.state.storage.put('lock', this.lock)

    return Response.json({ released: true, runId: releasedRunId })
  }

  private getStatus(): Response {
    return Response.json(this.lock)
  }

  private async transition(request: Request): Promise<Response> {
    if (!this.lock.held || !this.lock.status) {
      return Response.json({ error: 'No active payroll run' }, { status: 400 })
    }

    const { nextStatus } = await request.json() as { nextStatus: PayrollRunStatus }

    if (!canTransition(this.lock.status, nextStatus)) {
      return Response.json(
        { error: `Invalid transition: ${this.lock.status} → ${nextStatus}` },
        { status: 422 }
      )
    }

    this.lock.status = nextStatus
    await this.state.storage.put('lock', this.lock)

    return Response.json({ status: this.lock.status, runId: this.lock.runId })
  }
}

import type { PayrollRunStatus } from './types'
import { canTransition } from './engine'

export interface PayrollProgress {
  totalEmployees: number
  processedEmployees: number
  currentStage: 'initiating' | 'calculating_tax' | 'writing_records' | 'generating_payslips' | 'completed' | 'failed'
  percentComplete: number
  errors: Array<{ employeeId: string; reason: string }>
  startedAt: string
  updatedAt: string
}

export interface LockState {
  held: boolean
  orgId: string | null
  month: number | null
  year: number | null
  runId: string | null
  status: PayrollRunStatus | null
  heldAt: string | null
  progress?: PayrollProgress | null
}

const EMPTY_STATE: LockState = {
  held: false,
  orgId: null,
  month: null,
  year: null,
  runId: null,
  status: null,
  heldAt: null,
  progress: null,
}

/**
 * PayrollRunLock Durable Object.
 *
 * Guarantees only one payroll run can execute per org+month at a time and
 * persists real-time execution progress and stages for frontend polling.
 * The DO is keyed by `${orgId}:${year}:${month}` in the binding namespace.
 *
 * Endpoints:
 *   POST /acquire         — attempt to acquire the lock and initialize progress
 *   POST /release         — release the lock after run completes
 *   GET  /status          — check current lock state and lifecycle status
 *   GET  /progress        — get current execution progress + lock snapshot
 *   POST /progress/update — update execution progress stage, counts, and errors
 *   POST /transition      — advance the lifecycle state machine
 */
export class PayrollRunLock implements DurableObject {
  private state: DurableObjectState
  private lock: LockState = { ...EMPTY_STATE }
  private progress: PayrollProgress | null = null

  constructor(state: DurableObjectState, _env: unknown) {
    this.state = state
    this.state.blockConcurrencyWhile(async () => {
      const storedLock = await this.state.storage.get<LockState>('lock')
      const storedProgress = await this.state.storage.get<PayrollProgress>('progress')
      if (storedLock) this.lock = storedLock
      if (storedProgress) this.progress = storedProgress
    })
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname

    if (request.method === 'POST' && path === '/acquire') {
      return this.acquire(request)
    }
    if (request.method === 'POST' && (path === '/release' || path === '/force-release')) {
      if (path === '/force-release') {
        return this.forceRelease()
      }
      return this.release()
    }
    if (request.method === 'GET' && (path === '/status' || path === '/progress')) {
      return this.getProgressAndStatus()
    }
    if (request.method === 'POST' && path === '/progress/update') {
      return this.updateProgress(request)
    }
    if (request.method === 'POST' && path === '/transition') {
      return this.transition(request)
    }

    return new Response('Not Found', { status: 404 })
  }

  private async acquire(request: Request): Promise<Response> {
    if (this.lock.status === 'frozen') {
      return Response.json(
        {
          error: 'Month is frozen and immutable',
          status: 'frozen',
          runId: this.lock.runId,
          progress: this.progress,
        },
        { status: 409 }
      )
    }

    if (this.lock.held) {
      return Response.json(
        {
          error: 'Lock already held',
          runId: this.lock.runId,
          heldAt: this.lock.heldAt,
          progress: this.progress,
        },
        { status: 409 }
      )
    }

    const body = (await request.json().catch(() => ({}))) as {
      orgId: string
      month: number
      year: number
      runId: string
      totalEmployees?: number
    }

    const now = new Date().toISOString()
    const totalEmployees = body.totalEmployees || 0

    this.progress = {
      totalEmployees,
      processedEmployees: 0,
      currentStage: 'initiating',
      percentComplete: 0,
      errors: [],
      startedAt: now,
      updatedAt: now,
    }

    this.lock = {
      held: true,
      orgId: body.orgId,
      month: body.month,
      year: body.year,
      runId: body.runId,
      status: 'draft',
      heldAt: now,
      progress: this.progress,
    }

    await this.state.storage.put('lock', this.lock)
    await this.state.storage.put('progress', this.progress)

    return Response.json({
      acquired: true,
      runId: body.runId,
      progress: this.progress,
    })
  }

  private async release(): Promise<Response> {
    if (!this.lock.held && this.lock.status !== 'frozen') {
      return Response.json({ error: 'No lock held' }, { status: 400 })
    }

    const releasedRunId = this.lock.runId
    const currentStatus = this.lock.status
    this.lock = {
      ...EMPTY_STATE,
      status: currentStatus === 'frozen' ? 'frozen' : null,
      progress: this.progress,
    }
    await this.state.storage.put('lock', this.lock)

    return Response.json({ released: true, runId: releasedRunId, progress: this.progress })
  }

  private async forceRelease(): Promise<Response> {
    const previous = { ...this.lock }
    this.lock = { ...EMPTY_STATE, progress: null }
    await this.state.storage.put('lock', this.lock)
    await this.state.storage.delete('progress')
    return Response.json({
      forceReleased: true,
      previousRunId: previous.runId,
      previousStatus: previous.status,
    })
  }

  private getProgressAndStatus(): Response {
    return Response.json({
      ...this.lock,
      progress: this.progress,
    })
  }

  private async updateProgress(request: Request): Promise<Response> {
    const body = (await request.json().catch(() => ({}))) as {
      currentStage?: PayrollProgress['currentStage']
      processedEmployees?: number
      incrementProcessed?: number
      totalEmployees?: number
      error?: { employeeId: string; reason: string }
      errors?: Array<{ employeeId: string; reason: string }>
    }

    const now = new Date().toISOString()

    if (!this.progress) {
      this.progress = {
        totalEmployees: body.totalEmployees || 0,
        processedEmployees: 0,
        currentStage: body.currentStage || 'initiating',
        percentComplete: 0,
        errors: [],
        startedAt: now,
        updatedAt: now,
      }
    }

    if (body.totalEmployees !== undefined && body.totalEmployees >= 0) {
      this.progress.totalEmployees = body.totalEmployees
    }

    if (body.currentStage !== undefined) {
      this.progress.currentStage = body.currentStage
    }

    if (body.processedEmployees !== undefined) {
      this.progress.processedEmployees = body.processedEmployees
    } else if (body.incrementProcessed !== undefined) {
      this.progress.processedEmployees += body.incrementProcessed
    }

    if (body.error) {
      this.progress.errors.push(body.error)
    }

    if (body.errors && Array.isArray(body.errors)) {
      this.progress.errors.push(...body.errors)
    }

    // Calculate percent complete
    if (this.progress.totalEmployees > 0) {
      this.progress.percentComplete = Math.min(
        100,
        Math.round((this.progress.processedEmployees / this.progress.totalEmployees) * 100)
      )
    } else if (this.progress.currentStage === 'completed') {
      this.progress.percentComplete = 100
    } else {
      this.progress.percentComplete = 0
    }

    this.progress.updatedAt = now
    this.lock.progress = this.progress

    await this.state.storage.put('progress', this.progress)
    await this.state.storage.put('lock', this.lock)

    return Response.json(this.progress)
  }

  private async transition(request: Request): Promise<Response> {
    if (!this.lock.held || !this.lock.status) {
      return Response.json({ error: 'No active payroll run' }, { status: 400 })
    }

    const { nextStatus } = (await request.json()) as { nextStatus: PayrollRunStatus }

    if (!canTransition(this.lock.status, nextStatus)) {
      return Response.json(
        { error: `Invalid transition: ${this.lock.status} → ${nextStatus}` },
        { status: 422 }
      )
    }

    this.lock.status = nextStatus

    // Sync progress stage when lifecycle reaches computed or frozen
    if (this.progress) {
      if (nextStatus === 'computed' || nextStatus === 'approved' || nextStatus === 'frozen') {
        this.progress.currentStage = 'completed'
        this.progress.percentComplete = 100
        this.progress.updatedAt = new Date().toISOString()
        await this.state.storage.put('progress', this.progress)
      }
      this.lock.progress = this.progress
    }

    await this.state.storage.put('lock', this.lock)

    return Response.json({
      status: this.lock.status,
      runId: this.lock.runId,
      progress: this.progress,
    })
  }
}

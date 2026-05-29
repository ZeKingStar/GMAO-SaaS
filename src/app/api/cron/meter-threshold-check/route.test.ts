/**
 * Vitest tests for GET /api/cron/meter-threshold-check — Phase 09 Plan 02 (COND-02)
 *
 * Tests: auth (401), detection, idempotence, below-threshold, threshold advancement, filter.
 * Mocks: @/lib/db, @/actions/maintenance
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/db', () => ({
  db: {
    maintenancePlan: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    workOrder: {
      findFirst: vi.fn(),
    },
  },
}))

vi.mock('@/actions/maintenance', () => ({
  generateWorkOrderFromPlanInternal: vi.fn(),
}))

import { db } from '@/lib/db'
import { generateWorkOrderFromPlanInternal } from '@/actions/maintenance'
import { GET } from './route'

const CRON_SECRET = 'test-secret-abc'

function makeRequest(token?: string): NextRequest {
  const headers: Record<string, string> = {}
  if (token !== undefined) {
    headers['authorization'] = `Bearer ${token}`
  }
  return new NextRequest('http://localhost/api/cron/meter-threshold-check', {
    method: 'GET',
    headers,
  })
}

/** Minimal meter_based plan fixture */
function makePlan(overrides: {
  id?: string
  organizationId?: string
  nextMeterValue?: number | null
  meterThreshold?: number | null
  assetId?: string | null
  meterValue?: number
} = {}) {
  const meterValue = overrides.meterValue ?? 1500
  return {
    id: overrides.id ?? 'plan-1',
    organizationId: overrides.organizationId ?? 'org-1',
    nextMeterValue: overrides.nextMeterValue !== undefined ? overrides.nextMeterValue : 1000,
    meterThreshold: overrides.meterThreshold !== undefined ? overrides.meterThreshold : 500,
    assetId: overrides.assetId !== undefined ? overrides.assetId : 'asset-1',
    asset: {
      meters: [{ id: 'meter-1', value: meterValue }],
    },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.CRON_SECRET = CRON_SECRET
})

describe('GET /api/cron/meter-threshold-check', () => {
  // Test 1 — Auth: reject requests without valid Bearer token
  it('returns 401 when authorization header is missing', async () => {
    const req = makeRequest(undefined)
    const res = await GET(req)
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBeDefined()
  })

  it('returns 401 when Bearer token is incorrect', async () => {
    const req = makeRequest('wrong-token')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  // Test 2 — Detection: triggers WO generation when meter.value >= nextMeterValue
  it('calls generateWorkOrderFromPlanInternal when meter.value >= nextMeterValue and no active WO', async () => {
    const plan = makePlan({ meterValue: 1500, nextMeterValue: 1000 })
    vi.mocked(db.maintenancePlan.findMany).mockResolvedValue([plan] as never)
    vi.mocked(db.workOrder.findFirst).mockResolvedValue(null)
    vi.mocked(generateWorkOrderFromPlanInternal).mockResolvedValue({ id: 'wo-1', number: 1 } as never)
    vi.mocked(db.maintenancePlan.update).mockResolvedValue({} as never)

    const req = makeRequest(CRON_SECRET)
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.triggered).toBe(1)
    expect(generateWorkOrderFromPlanInternal).toHaveBeenCalledOnce()
    expect(generateWorkOrderFromPlanInternal).toHaveBeenCalledWith('plan-1', 'org-1')
  })

  // Test 3 — Idempotence: skips if an active WO already exists for the plan
  it('does NOT call generateWorkOrderFromPlanInternal when an active WO already exists', async () => {
    const plan = makePlan({ meterValue: 1500, nextMeterValue: 1000 })
    vi.mocked(db.maintenancePlan.findMany).mockResolvedValue([plan] as never)
    vi.mocked(db.workOrder.findFirst).mockResolvedValue({ id: 'wo-existing' } as never)

    const req = makeRequest(CRON_SECRET)
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.triggered).toBe(0)
    expect(generateWorkOrderFromPlanInternal).not.toHaveBeenCalled()
  })

  // Test 4 — Below threshold: no generation when meter.value < nextMeterValue
  it('does NOT call generateWorkOrderFromPlanInternal when meter.value < nextMeterValue', async () => {
    const plan = makePlan({ meterValue: 500, nextMeterValue: 1000 })
    vi.mocked(db.maintenancePlan.findMany).mockResolvedValue([plan] as never)
    vi.mocked(db.workOrder.findFirst).mockResolvedValue(null)

    const req = makeRequest(CRON_SECRET)
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.triggered).toBe(0)
    expect(generateWorkOrderFromPlanInternal).not.toHaveBeenCalled()
  })

  // Test 5 — Threshold advancement: nextMeterValue is updated to meter.value + meterThreshold
  it('advances nextMeterValue to meter.value + meterThreshold after WO generation', async () => {
    const plan = makePlan({ meterValue: 1500, nextMeterValue: 1000, meterThreshold: 500 })
    vi.mocked(db.maintenancePlan.findMany).mockResolvedValue([plan] as never)
    vi.mocked(db.workOrder.findFirst).mockResolvedValue(null)
    vi.mocked(generateWorkOrderFromPlanInternal).mockResolvedValue({ id: 'wo-1', number: 1 } as never)
    vi.mocked(db.maintenancePlan.update).mockResolvedValue({} as never)

    const req = makeRequest(CRON_SECRET)
    await GET(req)

    expect(db.maintenancePlan.update).toHaveBeenCalledWith({
      where: { id: 'plan-1' },
      data: { nextMeterValue: 1500 + 500 }, // meter.value + meterThreshold = 2000
    })
  })

  // Test 6 — Filter: plans without asset meters are skipped gracefully
  it('skips a plan that has no meters (asset.meters is empty)', async () => {
    const planNoMeter = {
      ...makePlan(),
      asset: { meters: [] }, // no meter
    }
    vi.mocked(db.maintenancePlan.findMany).mockResolvedValue([planNoMeter] as never)

    const req = makeRequest(CRON_SECRET)
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.triggered).toBe(0)
    expect(generateWorkOrderFromPlanInternal).not.toHaveBeenCalled()
  })
})

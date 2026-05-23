/**
 * Route Handler tests for GET + POST /api/v1/work-orders — Phase 4 Plan 02
 *
 * Tests auth (401/403), pagination, org-scoping, WO creation, and cross-org safety.
 * Mocks: @/lib/api-auth, @/lib/db
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/api-auth', () => ({
  validateApiKey: vi.fn(),
  requireApiPlan: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  db: {
    apiKey: {
      update: vi.fn().mockResolvedValue({}),
    },
    workOrder: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}))

import { db } from '@/lib/db'
import { validateApiKey, requireApiPlan } from '@/lib/api-auth'
import { GET, POST } from './route'

const IDENTITY = { organizationId: 'org-abc', keyId: 'key-123' }

function makeGetRequest(search = ''): NextRequest {
  return new NextRequest(`http://localhost/api/v1/work-orders${search}`, {
    method: 'GET',
    headers: { Authorization: 'Bearer krv_test' },
  })
}

function makePostRequest(body: unknown, addAuth = true): NextRequest {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (addAuth) headers['Authorization'] = 'Bearer krv_test'
  return new NextRequest('http://localhost/api/v1/work-orders', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

const VALID_WO_BODY = {
  title: 'Remplacement pompe',
  type: 'corrective',
  priority: 'high',
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── GET Tests ────────────────────────────────────────────────────────────────

describe('GET /api/v1/work-orders', () => {
  it('Test 1 — GET 401: no Authorization header returns 401', async () => {
    vi.mocked(validateApiKey).mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/v1/work-orders', { method: 'GET' })
    const res = await GET(req)
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body).toMatchObject({ error: expect.stringContaining('invalide') })
  })

  it('Test 2 — GET 403: valid key but starter tier returns 403', async () => {
    vi.mocked(validateApiKey).mockResolvedValue(IDENTITY)
    vi.mocked(requireApiPlan).mockResolvedValue(false)
    const res = await GET(makeGetRequest())
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toMatch(/forfait/)
  })

  it('Test 3 — GET 200: valid key + growth tier returns paginated WOs scoped to org', async () => {
    vi.mocked(validateApiKey).mockResolvedValue(IDENTITY)
    vi.mocked(requireApiPlan).mockResolvedValue(true)
    const mockWOs = [{ id: 'wo-1', number: 1, title: 'Test WO', organizationId: 'org-abc' }]
    vi.mocked(db.workOrder.findMany).mockResolvedValue(mockWOs as any)
    vi.mocked(db.workOrder.count).mockResolvedValue(1)

    const res = await GET(makeGetRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({ data: mockWOs, total: 1, page: 1, limit: 20 })

    // Verify org-scoping
    expect(db.workOrder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizationId: 'org-abc' } })
    )
    expect(db.workOrder.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizationId: 'org-abc' } })
    )
  })

  it('Test 4 — GET 200 pagination: ?page=2&limit=5 → skip=5, take=5', async () => {
    vi.mocked(validateApiKey).mockResolvedValue(IDENTITY)
    vi.mocked(requireApiPlan).mockResolvedValue(true)
    vi.mocked(db.workOrder.findMany).mockResolvedValue([])
    vi.mocked(db.workOrder.count).mockResolvedValue(0)

    const res = await GET(makeGetRequest('?page=2&limit=5'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({ page: 2, limit: 5 })
    expect(db.workOrder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 5, take: 5 })
    )
  })

  it('Test 5 — GET 200 limit cap: ?limit=999 → effective take=100', async () => {
    vi.mocked(validateApiKey).mockResolvedValue(IDENTITY)
    vi.mocked(requireApiPlan).mockResolvedValue(true)
    vi.mocked(db.workOrder.findMany).mockResolvedValue([])
    vi.mocked(db.workOrder.count).mockResolvedValue(0)

    const res = await GET(makeGetRequest('?limit=999'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.limit).toBe(100)
    expect(db.workOrder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 100 })
    )
  })

  it('Test 6 — GET updates lastUsedAt on successful call', async () => {
    vi.mocked(validateApiKey).mockResolvedValue(IDENTITY)
    vi.mocked(requireApiPlan).mockResolvedValue(true)
    vi.mocked(db.workOrder.findMany).mockResolvedValue([])
    vi.mocked(db.workOrder.count).mockResolvedValue(0)

    await GET(makeGetRequest())

    // Allow fire-and-forget to settle
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(db.apiKey.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'key-123' },
        data: expect.objectContaining({ lastUsedAt: expect.any(Date) }),
      })
    )
  })
})

// ─── POST Tests ───────────────────────────────────────────────────────────────

describe('POST /api/v1/work-orders', () => {
  it('Test 7 — POST 401: missing key → 401', async () => {
    vi.mocked(validateApiKey).mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/v1/work-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(VALID_WO_BODY),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('Test 8 — POST 403: starter tier → 403', async () => {
    vi.mocked(validateApiKey).mockResolvedValue(IDENTITY)
    vi.mocked(requireApiPlan).mockResolvedValue(false)
    const res = await POST(makePostRequest(VALID_WO_BODY))
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toMatch(/forfait/)
  })

  it('Test 9 — POST 400: invalid body (title="") → validation error', async () => {
    vi.mocked(validateApiKey).mockResolvedValue(IDENTITY)
    vi.mocked(requireApiPlan).mockResolvedValue(true)
    const res = await POST(makePostRequest({ title: '', type: 'corrective', priority: 'high' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body).toMatchObject({ error: 'Validation', issues: expect.any(Array) })
  })

  it('Test 10 — POST 201: valid body creates WO with number = max + 1', async () => {
    vi.mocked(validateApiKey).mockResolvedValue(IDENTITY)
    vi.mocked(requireApiPlan).mockResolvedValue(true)
    vi.mocked(db.workOrder.findFirst).mockResolvedValue({ number: 5 } as any)
    const createdWO = {
      id: 'wo-new',
      number: 6,
      title: 'Remplacement pompe',
      description: null,
      status: 'open',
      priority: 'high',
      type: 'corrective',
      siteId: null,
      assetId: null,
      dueDate: null,
      estimatedHours: null,
      organizationId: 'org-abc',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    vi.mocked(db.workOrder.create).mockResolvedValue(createdWO as any)

    const res = await POST(makePostRequest(VALID_WO_BODY))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.number).toBe(6)
    expect(body.organizationId).toBe('org-abc')

    expect(db.workOrder.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          number: 6,
          title: 'Remplacement pompe',
        }),
      })
    )
  })

  it('Test 11 — POST cross-org safety: organizationId from body is ignored', async () => {
    vi.mocked(validateApiKey).mockResolvedValue(IDENTITY) // org-abc
    vi.mocked(requireApiPlan).mockResolvedValue(true)
    vi.mocked(db.workOrder.findFirst).mockResolvedValue(null)
    const createdWO = {
      id: 'wo-safe',
      number: 1,
      title: 'Test cross-org',
      description: null,
      status: 'open',
      priority: 'high',
      type: 'corrective',
      siteId: null,
      assetId: null,
      dueDate: null,
      estimatedHours: null,
      organizationId: 'org-abc',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    vi.mocked(db.workOrder.create).mockResolvedValue(createdWO as any)

    // Attacker injects a different organizationId in the body
    const res = await POST(
      makePostRequest({ ...VALID_WO_BODY, organizationId: 'org-evil' })
    )
    expect(res.status).toBe(201)

    // The create call must use identity.organizationId (org-abc), NOT org-evil
    expect(db.workOrder.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: 'org-abc',
        }),
      })
    )
    const createCall = vi.mocked(db.workOrder.create).mock.calls[0][0]
    expect((createCall.data as Record<string, unknown>).organizationId).toBe('org-abc')
  })
})

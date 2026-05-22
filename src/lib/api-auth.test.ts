/**
 * Unit tests for api-auth.ts helpers — Phase 4 API-01
 *
 * Tests validateApiKey() and requireApiPlan() in isolation.
 * Mocking: @/lib/db (apiKey + subscription), next/server (NextRequest constructor).
 *
 * These helpers are Clerk-free — no @clerk mocks needed.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createHash } from 'crypto'

// Override the global db mock from vitest.setup.ts with apiKey + subscription
vi.mock('@/lib/db', () => ({
  db: {
    apiKey: {
      findUnique: vi.fn(),
    },
    subscription: {
      findUnique: vi.fn(),
    },
  },
}))

import { db } from '@/lib/db'
import { validateApiKey, requireApiPlan } from '@/lib/api-auth'
import { NextRequest } from 'next/server'

function makeRequest(authHeader?: string): NextRequest {
  const headers: Record<string, string> = {}
  if (authHeader !== undefined) headers['Authorization'] = authHeader
  return new NextRequest('http://localhost/api/v1/test', { headers })
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── validateApiKey() ─────────────────────────────────────────────────────────

describe('validateApiKey()', () => {
  it('Test 1: returns null when Authorization header is missing', async () => {
    const req = makeRequest()
    const result = await validateApiKey(req)
    expect(result).toBeNull()
  })

  it("Test 2: returns null when header doesn't start with 'Bearer '", async () => {
    const req = makeRequest('Basic abc123')
    const result = await validateApiKey(req)
    expect(result).toBeNull()
  })

  it('Test 3: returns null when the hashed key is not in DB', async () => {
    vi.mocked(db.apiKey.findUnique).mockResolvedValue(null)
    const req = makeRequest('Bearer krv_notexist')
    const result = await validateApiKey(req)
    expect(result).toBeNull()
  })

  it('Test 4: returns null when matched ApiKey has isActive: false', async () => {
    vi.mocked(db.apiKey.findUnique).mockResolvedValue({
      id: 'key-1',
      organizationId: 'org-1',
      isActive: false,
      expiresAt: null,
    } as any)
    const req = makeRequest('Bearer krv_inactive123')
    const result = await validateApiKey(req)
    expect(result).toBeNull()
  })

  it('Test 5: returns null when expiresAt is in the past', async () => {
    vi.mocked(db.apiKey.findUnique).mockResolvedValue({
      id: 'key-1',
      organizationId: 'org-1',
      isActive: true,
      expiresAt: new Date('2020-01-01'),
    } as any)
    const req = makeRequest('Bearer krv_expired123')
    const result = await validateApiKey(req)
    expect(result).toBeNull()
  })

  it('Test 6: returns { organizationId, keyId } for a valid active non-expired key', async () => {
    vi.mocked(db.apiKey.findUnique).mockResolvedValue({
      id: 'key-1',
      organizationId: 'org-1',
      isActive: true,
      expiresAt: null,
    } as any)
    const req = makeRequest('Bearer krv_validkey123')
    const result = await validateApiKey(req)
    expect(result).toEqual({ organizationId: 'org-1', keyId: 'key-1' })
  })

  it('Test 7: correctly hashes the bearer token with SHA-256 before DB lookup', async () => {
    const rawKey = 'krv_test123'
    const expectedHash = createHash('sha256').update(rawKey).digest('hex')

    vi.mocked(db.apiKey.findUnique).mockResolvedValue({
      id: 'key-7',
      organizationId: 'org-7',
      isActive: true,
      expiresAt: null,
    } as any)

    const req = makeRequest(`Bearer ${rawKey}`)
    await validateApiKey(req)

    expect(db.apiKey.findUnique).toHaveBeenCalledWith({
      where: { hashedKey: expectedHash },
      select: { id: true, organizationId: true, isActive: true, expiresAt: true },
    })
  })
})

// ─── requireApiPlan() ─────────────────────────────────────────────────────────

describe('requireApiPlan()', () => {
  it('Test 8: returns false when subscription is null', async () => {
    vi.mocked(db.subscription.findUnique).mockResolvedValue(null)
    const result = await requireApiPlan('org-1', ['growth', 'enterprise'])
    expect(result).toBe(false)
  })

  it("Test 9: returns false when subscription.plan='starter'", async () => {
    vi.mocked(db.subscription.findUnique).mockResolvedValue({
      plan: 'starter',
      status: 'active',
    } as any)
    const result = await requireApiPlan('org-1', ['growth', 'enterprise'])
    expect(result).toBe(false)
  })

  it("Test 10: returns false when plan='growth' but status='canceled'", async () => {
    vi.mocked(db.subscription.findUnique).mockResolvedValue({
      plan: 'growth',
      status: 'canceled',
    } as any)
    const result = await requireApiPlan('org-1', ['growth', 'enterprise'])
    expect(result).toBe(false)
  })

  it("Test 11: returns true when plan='growth' status='active'", async () => {
    vi.mocked(db.subscription.findUnique).mockResolvedValue({
      plan: 'growth',
      status: 'active',
    } as any)
    const result = await requireApiPlan('org-1', ['growth', 'enterprise'])
    expect(result).toBe(true)
  })

  it("Test 12: returns true when plan='enterprise' status='trialing'", async () => {
    vi.mocked(db.subscription.findUnique).mockResolvedValue({
      plan: 'enterprise',
      status: 'trialing',
    } as any)
    const result = await requireApiPlan('org-1', ['growth', 'enterprise'])
    expect(result).toBe(true)
  })
})

/**
 * Unit tests for requirePlan() — Phase 2 GATE-01
 *
 * Tests the effective-plan derivation logic by mocking at the dependency level:
 * - @/lib/better-auth auth.api.getSession → controls authentication state
 * - @/lib/db db.membership.findFirst → controls what subscription data is returned
 *
 * This approach works in ESM: mocking the exported getOrganizationMembership
 * doesn't intercept requirePlan's internal call to it (same-module binding).
 * Mocking the lower-level deps lets the full call chain run.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { auth } from '@/lib/better-auth'
import { db } from '@/lib/db'
import { requirePlan } from '@/lib/auth'

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => new Headers()),
}))

vi.mock('@/lib/better-auth', () => ({
  auth: { api: { getSession: vi.fn() } },
}))

const mockSession = (userId: string | null, orgId: string | null) =>
  userId
    ? { user: { id: userId }, session: { activeOrganizationId: orgId } }
    : null

const mockMembership = (plan: string, status: string | null) => ({
  id: 'mem-1',
  userId: 'user-1',
  organization: {
    id: 'org-1',
    subscription: status === null
      ? null
      : {
          id: 'sub-1',
          plan,
          status,
          currentPeriodEnd: new Date('2026-06-19'),
          trialEndsAt: null,
          currentPeriodStart: new Date('2026-05-19'),
        },
  },
})

beforeEach(() => {
  vi.clearAllMocks()
  // Default: authenticated user with a valid active organization
  vi.mocked(auth.api.getSession).mockResolvedValue(mockSession('user-1', 'org-1') as any)
})

describe('requirePlan()', () => {
  it('returns hasAccess: false for starter active subscription', async () => {
    vi.mocked(db.membership.findFirst).mockResolvedValue(mockMembership('starter', 'active') as any)
    const result = await requirePlan(['growth', 'enterprise'])
    expect(result.hasAccess).toBe(false)
    expect(result.effectivePlan).toBe('starter')
  })

  it('returns hasAccess: true for growth active subscription', async () => {
    vi.mocked(db.membership.findFirst).mockResolvedValue(mockMembership('growth', 'active') as any)
    const result = await requirePlan(['growth', 'enterprise'])
    expect(result.hasAccess).toBe(true)
    expect(result.effectivePlan).toBe('growth')
  })

  it('returns hasAccess: true for growth trialing subscription', async () => {
    vi.mocked(db.membership.findFirst).mockResolvedValue(mockMembership('growth', 'trialing') as any)
    const result = await requirePlan(['growth', 'enterprise'])
    expect(result.hasAccess).toBe(true)
    expect(result.effectivePlan).toBe('growth')
  })

  it('returns hasAccess: false for growth past_due subscription (degrades to starter)', async () => {
    vi.mocked(db.membership.findFirst).mockResolvedValue(mockMembership('growth', 'past_due') as any)
    const result = await requirePlan(['growth', 'enterprise'])
    expect(result.hasAccess).toBe(false)
    expect(result.effectivePlan).toBe('starter')
  })

  it('returns hasAccess: false for growth canceled subscription (degrades to starter)', async () => {
    vi.mocked(db.membership.findFirst).mockResolvedValue(mockMembership('growth', 'canceled') as any)
    const result = await requirePlan(['growth', 'enterprise'])
    expect(result.hasAccess).toBe(false)
    expect(result.effectivePlan).toBe('starter')
  })

  it('returns hasAccess: false for growth unpaid subscription (degrades to starter)', async () => {
    vi.mocked(db.membership.findFirst).mockResolvedValue(mockMembership('growth', 'unpaid') as any)
    const result = await requirePlan(['growth', 'enterprise'])
    expect(result.hasAccess).toBe(false)
    expect(result.effectivePlan).toBe('starter')
  })

  it('returns hasAccess: false for null subscription (no subscription row)', async () => {
    vi.mocked(db.membership.findFirst).mockResolvedValue(mockMembership('starter', null) as any)
    const result = await requirePlan(['growth', 'enterprise'])
    expect(result.hasAccess).toBe(false)
    expect(result.effectivePlan).toBe('starter')
  })

  it('throws Unauthorized when getOrganizationMembership returns null (unauthenticated)', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession(null, null) as any)
    await expect(requirePlan(['growth', 'enterprise'])).rejects.toThrow('Unauthorized')
  })

  it('returns hasAccess: true for enterprise active when enterprise is in allowed list', async () => {
    vi.mocked(db.membership.findFirst).mockResolvedValue(mockMembership('enterprise', 'active') as any)
    const result = await requirePlan(['growth', 'enterprise'])
    expect(result.hasAccess).toBe(true)
    expect(result.effectivePlan).toBe('enterprise')
  })
})

/**
 * Unit tests for requirePlan() — Phase 2 GATE-01
 *
 * These tests cover the effective-plan derivation logic only.
 * requirePlan() calls getOrganizationMembership() internally; we mock that
 * at the module level so tests are pure unit tests with no DB or Clerk calls.
 *
 * RED state: requirePlan() does not yet exist. Stubs will fail until Plan 02-01 Task 1.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Module mock — must be declared before importing the module under test
vi.mock('@/lib/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth')>()
  return {
    ...actual,
    getOrganizationMembership: vi.fn(),
  }
})

import { requirePlan, getOrganizationMembership } from '@/lib/auth'

const mockMembership = (plan: string, status: string | null) => ({
  id: 'mem-1',
  clerkUserId: 'user-1',
  organization: {
    id: 'org-1',
    clerkId: 'clerk-org-1',
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
})

describe('requirePlan()', () => {
  it('returns hasAccess: false for starter active subscription', async () => {
    vi.mocked(getOrganizationMembership).mockResolvedValue(mockMembership('starter', 'active') as any)
    const result = await requirePlan(['growth', 'enterprise'])
    expect(result.hasAccess).toBe(false)
    expect(result.effectivePlan).toBe('starter')
  })

  it('returns hasAccess: true for growth active subscription', async () => {
    vi.mocked(getOrganizationMembership).mockResolvedValue(mockMembership('growth', 'active') as any)
    const result = await requirePlan(['growth', 'enterprise'])
    expect(result.hasAccess).toBe(true)
    expect(result.effectivePlan).toBe('growth')
  })

  it('returns hasAccess: true for growth trialing subscription', async () => {
    vi.mocked(getOrganizationMembership).mockResolvedValue(mockMembership('growth', 'trialing') as any)
    const result = await requirePlan(['growth', 'enterprise'])
    expect(result.hasAccess).toBe(true)
    expect(result.effectivePlan).toBe('growth')
  })

  it('returns hasAccess: false for growth past_due subscription (degrades to starter)', async () => {
    vi.mocked(getOrganizationMembership).mockResolvedValue(mockMembership('growth', 'past_due') as any)
    const result = await requirePlan(['growth', 'enterprise'])
    expect(result.hasAccess).toBe(false)
    expect(result.effectivePlan).toBe('starter')
  })

  it('returns hasAccess: false for growth canceled subscription (degrades to starter)', async () => {
    vi.mocked(getOrganizationMembership).mockResolvedValue(mockMembership('growth', 'canceled') as any)
    const result = await requirePlan(['growth', 'enterprise'])
    expect(result.hasAccess).toBe(false)
    expect(result.effectivePlan).toBe('starter')
  })

  it('returns hasAccess: false for growth unpaid subscription (degrades to starter)', async () => {
    vi.mocked(getOrganizationMembership).mockResolvedValue(mockMembership('growth', 'unpaid') as any)
    const result = await requirePlan(['growth', 'enterprise'])
    expect(result.hasAccess).toBe(false)
    expect(result.effectivePlan).toBe('starter')
  })

  it('returns hasAccess: false for null subscription (no subscription row)', async () => {
    vi.mocked(getOrganizationMembership).mockResolvedValue(mockMembership('starter', null) as any)
    const result = await requirePlan(['growth', 'enterprise'])
    expect(result.hasAccess).toBe(false)
    expect(result.effectivePlan).toBe('starter')
  })

  it('throws Unauthorized when getOrganizationMembership returns null (unauthenticated)', async () => {
    vi.mocked(getOrganizationMembership).mockResolvedValue(null)
    await expect(requirePlan(['growth', 'enterprise'])).rejects.toThrow('Unauthorized')
  })

  it('returns hasAccess: true for enterprise active when enterprise is in allowed list', async () => {
    vi.mocked(getOrganizationMembership).mockResolvedValue(mockMembership('enterprise', 'active') as any)
    const result = await requirePlan(['growth', 'enterprise'])
    expect(result.hasAccess).toBe(true)
    expect(result.effectivePlan).toBe('enterprise')
  })
})

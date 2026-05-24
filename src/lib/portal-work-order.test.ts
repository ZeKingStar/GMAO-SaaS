/**
 * Unit tests for portal-validation.ts and portal-work-order.ts — Phase 5 05-01
 *
 * Tests portalSubmitSchema validation and createPortalWorkOrder() in isolation.
 * Mocking: @/lib/db (workOrder.findFirst + workOrder.create).
 * CRITICAL: organizationId must always come from params, NEVER from input.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db', () => ({
  db: {
    workOrder: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}))

import { db } from '@/lib/db'
import { portalSubmitSchema } from '@/lib/portal-validation'
import { createPortalWorkOrder } from '@/lib/portal-work-order'

const mockFindFirst = db.workOrder.findFirst as ReturnType<typeof vi.fn>
const mockCreate = db.workOrder.create as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── portalSubmitSchema ───────────────────────────────────────────────────────

describe('portalSubmitSchema', () => {
  it('Test 1: rejects empty object (required fields missing)', () => {
    const result = portalSubmitSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('Test 2: rejects description shorter than 10 chars', () => {
    const result = portalSubmitSchema.safeParse({
      requesterName: 'X',
      requesterEmail: 'a@b.c',
      description: 'court',
    })
    expect(result.success).toBe(false)
  })

  it('Test 3: accepts valid payload and honeypot is undefined when not provided', () => {
    const result = portalSubmitSchema.safeParse({
      requesterName: 'Alice Tremblay',
      requesterEmail: 'alice@example.com',
      description: 'La pompe de chauffage est en panne depuis hier matin.',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.honeypot).toBeUndefined()
    }
  })

  it('Test 4: accepts honeypot field as optional (empty string is valid)', () => {
    const result = portalSubmitSchema.safeParse({
      requesterName: 'Bob Martin',
      requesterEmail: 'bob@example.com',
      description: 'Description longue de la demande de maintenance.',
      honeypot: '',
    })
    expect(result.success).toBe(true)
  })
})

// ─── createPortalWorkOrder() ──────────────────────────────────────────────────

const validInput = {
  requesterName: 'Alice Tremblay',
  requesterEmail: 'alice@example.com',
  description: 'La pompe de chauffage est en panne depuis hier matin.',
  locationDescription: 'Salle mécanique B-12',
}

describe('createPortalWorkOrder()', () => {
  it('Test 5: calls db.workOrder.findFirst then db.workOrder.create with correct params', async () => {
    mockFindFirst.mockResolvedValueOnce(null)
    mockCreate.mockResolvedValueOnce({
      id: 'wo-1',
      number: 1,
      title: 'Demande portail — Alice Tremblay',
      description: 'Demandeur: Alice Tremblay <alice@example.com>\nLocalisation: Salle mécanique B-12\n\nLa pompe de chauffage est en panne depuis hier matin.',
      status: 'open',
      priority: 'medium',
      type: 'service_request',
      siteId: 'site-123',
      organizationId: 'org-test-id',
      createdAt: new Date(),
    })

    await createPortalWorkOrder({
      organizationId: 'org-test-id',
      siteId: 'site-123',
      input: validInput,
    })

    expect(mockFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: 'org-test-id' },
        orderBy: { number: 'desc' },
        select: { number: true },
      })
    )

    // ASSV V4: organizationId comes from params, NEVER from input
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: 'org-test-id',
          type: 'service_request',
          status: 'open',
          priority: 'medium',
        }),
      })
    )
  })

  it('Test 6: computes number = (last?.number ?? 0) + 1', async () => {
    mockFindFirst.mockResolvedValueOnce({ number: 7 })
    mockCreate.mockResolvedValueOnce({
      id: 'wo-8',
      number: 8,
      title: 'Demande portail — Alice Tremblay',
      description: 'test',
      status: 'open',
      priority: 'medium',
      type: 'service_request',
      siteId: 'site-123',
      organizationId: 'org-test-id',
      createdAt: new Date(),
    })

    await createPortalWorkOrder({
      organizationId: 'org-test-id',
      siteId: 'site-123',
      input: validInput,
    })

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ number: 8 }),
      })
    )
  })

  it('Test 7: returns the created work order including number', async () => {
    mockFindFirst.mockResolvedValueOnce(null)
    const mockWo = {
      id: 'wo-1',
      number: 1,
      title: 'Demande portail — Alice Tremblay',
      description: 'test',
      status: 'open',
      priority: 'medium',
      type: 'service_request',
      siteId: 'site-123',
      organizationId: 'org-test-id',
      createdAt: new Date(),
    }
    mockCreate.mockResolvedValueOnce(mockWo)

    const result = await createPortalWorkOrder({
      organizationId: 'org-test-id',
      siteId: 'site-123',
      input: validInput,
    })

    expect(result).toEqual(mockWo)
    expect(result.number).toBe(1)
  })
})

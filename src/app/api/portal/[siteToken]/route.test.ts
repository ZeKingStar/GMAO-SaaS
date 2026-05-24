/**
 * Tests Vitest pour Route Handler POST /api/portal/[siteToken]
 * Couvre PORTAL-01 (token lookup) et PORTAL-02 (création BT + email)
 * Tests A1–A9
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('@/lib/db', () => ({
  db: {
    site: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('@/lib/portal-work-order', () => ({
  createPortalWorkOrder: vi.fn(),
}))

vi.mock('@/lib/email', () => ({
  sendPortalConfirmationEmail: vi.fn(),
}))

// ─── Imports after mocks ─────────────────────────────────────────────────────

import { db } from '@/lib/db'
import { createPortalWorkOrder } from '@/lib/portal-work-order'
import { sendPortalConfirmationEmail } from '@/lib/email'
import { POST } from './route'

const mockFindUnique = db.site.findUnique as ReturnType<typeof vi.fn>
const mockCreateWorkOrder = createPortalWorkOrder as ReturnType<typeof vi.fn>
const mockSendEmail = sendPortalConfirmationEmail as ReturnType<typeof vi.fn>

// ─── Helpers ─────────────────────────────────────────────────────────────────

const VALID_SITE = {
  id: 'site-123',
  organizationId: 'org-abc',
  name: 'Site Principal',
  portalEnabled: true,
  organization: { name: 'Org Test' },
}

const VALID_BODY = {
  requesterName: 'Alice Tremblay',
  requesterEmail: 'alice@example.com',
  description: 'La pompe de chauffage est en panne depuis hier matin.',
}

function makeRequest(siteToken: string, body: unknown): [Request, { params: Promise<{ siteToken: string }> }] {
  const req = new Request(`http://localhost/api/portal/${siteToken}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return [req as Request, { params: Promise.resolve({ siteToken }) }]
}

function makeRawRequest(siteToken: string, rawBody: string): [Request, { params: Promise<{ siteToken: string }> }] {
  const req = new Request(`http://localhost/api/portal/${siteToken}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: rawBody,
  })
  return [req as Request, { params: Promise.resolve({ siteToken }) }]
}

// ─── Tests ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/portal/[siteToken]', () => {
  // A1 — PORTAL-01: Token inexistant → 404
  it('A1: unknown token → 404 with error message', async () => {
    mockFindUnique.mockResolvedValueOnce(null)

    const [req, ctx] = makeRequest('TOKEN-UNKNOWN', VALID_BODY)
    const res = await POST(req as Parameters<typeof POST>[0], ctx)

    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toBe('Portail introuvable')
  })

  // A2 — PORTAL-01: Token existant mais portalEnabled=false → 404
  it('A2: token exists but portalEnabled=false → 404', async () => {
    mockFindUnique.mockResolvedValueOnce({
      ...VALID_SITE,
      portalEnabled: false,
    })

    const [req, ctx] = makeRequest('TOKEN-DISABLED', VALID_BODY)
    const res = await POST(req as Parameters<typeof POST>[0], ctx)

    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toBe('Portail introuvable')
  })

  // A3 — PORTAL-01: Corps invalide (pas du JSON) → 400 avec mention 'JSON'
  it('A3: invalid JSON body → 400 with JSON mention in error', async () => {
    mockFindUnique.mockResolvedValueOnce(VALID_SITE)

    const [req, ctx] = makeRawRequest('TOKEN-VALID', 'not-valid-json{{{{')
    const res = await POST(req as Parameters<typeof POST>[0], ctx)

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/JSON|json/i)
  })

  // A4 — PORTAL-02: Token valide + body valide → 201, number > 0, organizationId from DB
  it('A4: valid token + valid body → 201 with work order number', async () => {
    mockFindUnique.mockResolvedValueOnce(VALID_SITE)
    mockCreateWorkOrder.mockResolvedValueOnce({
      id: 'wo-1',
      number: 42,
      status: 'open',
    })
    mockSendEmail.mockResolvedValueOnce(undefined)

    const [req, ctx] = makeRequest('TOKEN-VALID', VALID_BODY)
    const res = await POST(req as Parameters<typeof POST>[0], ctx)

    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.number).toBe(42)
    expect(typeof data.number).toBe('number')
    expect(data.number).toBeGreaterThan(0)

    // organizationId and siteId must come from DB, not body
    expect(mockCreateWorkOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-abc',
        siteId: 'site-123',
      })
    )
  })

  // A5 — PORTAL-02: Token valide + body invalide (description trop courte) → 400 + issues Zod
  it('A5: valid token + invalid body (description too short) → 400 with Zod issues', async () => {
    mockFindUnique.mockResolvedValueOnce(VALID_SITE)

    const [req, ctx] = makeRequest('TOKEN-VALID', {
      requesterName: 'Bob',
      requesterEmail: 'bob@example.com',
      description: 'Court',
    })
    const res = await POST(req as Parameters<typeof POST>[0], ctx)

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(Array.isArray(data.issues)).toBe(true)
    expect(data.issues.length).toBeGreaterThan(0)
  })

  // A6 — Sécurité: organizationId/siteId du body sont ignorés — viennent du site DB
  it('A6: body organizationId/siteId are ignored — DB values used', async () => {
    mockFindUnique.mockResolvedValueOnce(VALID_SITE)
    mockCreateWorkOrder.mockResolvedValueOnce({
      id: 'wo-1',
      number: 5,
      status: 'open',
    })
    mockSendEmail.mockResolvedValueOnce(undefined)

    const [req, ctx] = makeRequest('TOKEN-VALID', {
      ...VALID_BODY,
      organizationId: 'org-pirate',
      siteId: 'site-pirate',
    })
    const res = await POST(req as Parameters<typeof POST>[0], ctx)

    expect(res.status).toBe(201)
    // createPortalWorkOrder must receive the DB organizationId, NOT org-pirate
    expect(mockCreateWorkOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-abc',
        siteId: 'site-123',
      })
    )
    expect(mockCreateWorkOrder).not.toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-pirate',
      })
    )
  })

  // A7 — Anti-spam: honeypot rempli → 204, createPortalWorkOrder jamais appelé
  it('A7: honeypot filled → 204 without creating work order', async () => {
    mockFindUnique.mockResolvedValueOnce(VALID_SITE)

    const [req, ctx] = makeRequest('TOKEN-VALID', {
      ...VALID_BODY,
      honeypot: 'spam-content',
    })
    const res = await POST(req as Parameters<typeof POST>[0], ctx)

    expect(res.status).toBe(204)
    expect(mockCreateWorkOrder).not.toHaveBeenCalled()
    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  // A8 — PORTAL-02: sendPortalConfirmationEmail appelé avec les bonnes données
  it('A8: on success, sendPortalConfirmationEmail called with correct params', async () => {
    mockFindUnique.mockResolvedValueOnce(VALID_SITE)
    mockCreateWorkOrder.mockResolvedValueOnce({
      id: 'wo-1',
      number: 42,
      status: 'open',
    })
    mockSendEmail.mockResolvedValueOnce(undefined)

    const [req, ctx] = makeRequest('TOKEN-VALID', VALID_BODY)
    await POST(req as Parameters<typeof POST>[0], ctx)

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'alice@example.com',
        requesterName: 'Alice Tremblay',
        workOrderNumber: 42,
        siteName: 'Site Principal',
        organizationName: 'Org Test',
      })
    )
  })

  // A9 — Résilience: si sendPortalConfirmationEmail rejette, réponse reste 201 (fire-and-forget)
  it('A9: if sendPortalConfirmationEmail rejects, response is still 201', async () => {
    mockFindUnique.mockResolvedValueOnce(VALID_SITE)
    mockCreateWorkOrder.mockResolvedValueOnce({
      id: 'wo-1',
      number: 42,
      status: 'open',
    })
    mockSendEmail.mockRejectedValueOnce(new Error('Email service down'))

    const [req, ctx] = makeRequest('TOKEN-VALID', VALID_BODY)
    const res = await POST(req as Parameters<typeof POST>[0], ctx)

    // Must still return 201 despite email failure
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.number).toBe(42)
  })
})

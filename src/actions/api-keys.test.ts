/**
 * Unit tests for api-keys Server Actions — Phase 4 API-04
 *
 * Tests createApiKey(), listApiKeys(), revokeApiKey() in isolation.
 * Mocking: @/lib/db (apiKey + membership), @/lib/auth (requireRole).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createHash } from 'crypto'

// Override global mocks for this test file
vi.mock('@/lib/db', () => ({
  db: {
    apiKey: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth', () => ({
  requireRole: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { createApiKey, listApiKeys, revokeApiKey } from '@/actions/api-keys'

const mockMembership = {
  id: 'mem-1',
  organizationId: 'org-1',
  role: 'admin',
  clerkUserId: 'user-1',
  email: 'admin@test.com',
}

beforeEach(() => {
  vi.clearAllMocks()
  // Default: user is admin
  vi.mocked(requireRole).mockResolvedValue(mockMembership as any)
})

// ─── createApiKey() ───────────────────────────────────────────────────────────

describe('createApiKey()', () => {
  it('Test 1: returns object with shape { id, name, key, createdAt } where key starts with krv_ and is at least 60 chars', async () => {
    const now = new Date()
    vi.mocked(db.apiKey.create).mockResolvedValue({
      id: 'key-1',
      name: 'Production',
      createdAt: now,
    } as any)

    const result = await createApiKey('Production')

    expect(result).toMatchObject({
      id: 'key-1',
      name: 'Production',
      createdAt: now,
    })
    expect(result.key).toMatch(/^krv_/)
    expect(result.key.length).toBeGreaterThanOrEqual(60)
  })

  it('Test 2: calls db.apiKey.create with hashedKey = SHA-256 of returned key (raw key never persisted)', async () => {
    const now = new Date()
    vi.mocked(db.apiKey.create).mockResolvedValue({
      id: 'key-2',
      name: 'Test Key',
      createdAt: now,
    } as any)

    const result = await createApiKey('Test Key')

    // Get the hashedKey that was passed to db.create
    const createCall = vi.mocked(db.apiKey.create).mock.calls[0][0]
    const storedHash = createCall.data.hashedKey

    // Verify the stored hash is the SHA-256 of the returned raw key
    const expectedHash = createHash('sha256').update(result.key).digest('hex')
    expect(storedHash).toBe(expectedHash)

    // The raw key must NOT be stored
    expect(createCall.data).not.toHaveProperty('key')
  })

  it("Test 3: calls requireRole(['admin','manager']) — technician gets Forbidden", async () => {
    vi.mocked(requireRole).mockRejectedValue(new Error('Forbidden'))
    await expect(createApiKey('Should Fail')).rejects.toThrow('Forbidden')
    expect(requireRole).toHaveBeenCalledWith(['admin', 'manager'])
  })

  it('Test 6: two consecutive createApiKey() calls produce different key values (entropy check)', async () => {
    const now = new Date()
    vi.mocked(db.apiKey.create)
      .mockResolvedValueOnce({ id: 'key-a', name: 'Key A', createdAt: now } as any)
      .mockResolvedValueOnce({ id: 'key-b', name: 'Key B', createdAt: now } as any)

    const result1 = await createApiKey('Key A')
    const result2 = await createApiKey('Key B')

    expect(result1.key).not.toBe(result2.key)
  })
})

// ─── listApiKeys() ────────────────────────────────────────────────────────────

describe('listApiKeys()', () => {
  it('Test 4: returns rows WITHOUT key or hashedKey field — only id, name, createdAt, lastUsedAt, isActive, expiresAt', async () => {
    const now = new Date()
    vi.mocked(db.apiKey.findMany).mockResolvedValue([
      {
        id: 'key-1',
        name: 'Production',
        createdAt: now,
        lastUsedAt: null,
        isActive: true,
        expiresAt: null,
      },
    ] as any)

    const result = await listApiKeys()

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      id: 'key-1',
      name: 'Production',
      isActive: true,
    })
    // Must not contain raw key or hash
    expect(result[0]).not.toHaveProperty('key')
    expect(result[0]).not.toHaveProperty('hashedKey')
  })
})

// ─── revokeApiKey() ───────────────────────────────────────────────────────────

describe('revokeApiKey()', () => {
  it('Test 5: sets isActive: false scoped to org (passing foreign-org id throws)', async () => {
    // Foreign org key → findFirst returns null → should throw
    vi.mocked(db.apiKey.findFirst).mockResolvedValue(null)
    await expect(revokeApiKey('foreign-key-id')).rejects.toThrow()

    // Own org key → should succeed
    vi.mocked(db.apiKey.findFirst).mockResolvedValue({ id: 'key-1' } as any)
    vi.mocked(db.apiKey.update).mockResolvedValue({ id: 'key-1' } as any)

    const result = await revokeApiKey('key-1')
    expect(result).toEqual({ id: 'key-1', isActive: false })

    // Verify scope: findFirst called with organizationId from session
    expect(db.apiKey.findFirst).toHaveBeenCalledWith({
      where: { id: 'key-1', organizationId: 'org-1' },
      select: { id: true },
    })
  })
})

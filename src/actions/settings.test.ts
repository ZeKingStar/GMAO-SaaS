import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockCreate = vi.fn()
const mockRevoke = vi.fn()
const mockList = vi.fn()
const mockAuth = vi.fn()

vi.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
  clerkClient: vi.fn().mockResolvedValue({
    organizations: {
      createOrganizationInvitation: (...a: unknown[]) => mockCreate(...a),
      getOrganizationInvitationList: (...a: unknown[]) => mockList(...a),
      revokeOrganizationInvitation: (...a: unknown[]) => mockRevoke(...a),
    },
  }),
}))

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

// Mock de la couche DB pour piloter le rôle du membre courant (getAdminContext)
const mockOrgFind = vi.fn()
const mockMembershipFind = vi.fn()
vi.mock('@/lib/db', () => ({
  db: {
    organization: { findUnique: (...a: unknown[]) => mockOrgFind(...a) },
    membership: { findFirst: (...a: unknown[]) => mockMembershipFind(...a) },
  },
}))

import { inviteMember, revokeInvitation, listPendingInvitations } from './settings'

describe('inviteMember', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Auth par défaut : admin
    mockAuth.mockResolvedValue({ orgId: 'org_1', userId: 'u_admin' })
    mockOrgFind.mockResolvedValue({ id: 'orgUuid' })
    mockMembershipFind.mockResolvedValue({ role: 'admin' })
    mockCreate.mockResolvedValue({ id: 'inv_1', emailAddress: 'jean@exemple.com', role: 'org:technician' })
    mockRevoke.mockResolvedValue({ id: 'inv_1', status: 'revoked' })
    mockList.mockResolvedValue({ data: [] })
  })

  it('Test A (happy path admin) : appelle createOrganizationInvitation avec les bons paramètres', async () => {
    await inviteMember('jean@exemple.com', 'technician')
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org_1',
        emailAddress: 'jean@exemple.com',
        role: 'org:technician',
        inviterUserId: 'u_admin',
      })
    )
  })

  it('Test B (email invalide - vide) : throw Adresse e-mail invalide avant tout appel Clerk', async () => {
    await expect(inviteMember('   ', 'technician')).rejects.toThrow('Adresse e-mail invalide')
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('Test B (email invalide - malformé) : throw Adresse e-mail invalide avant tout appel Clerk', async () => {
    await expect(inviteMember('pasun-email', 'technician')).rejects.toThrow('Adresse e-mail invalide')
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('Test C (escalade rôle D-06) : manager ne peut pas inviter admin', async () => {
    mockMembershipFind.mockResolvedValue({ role: 'manager' })
    await expect(inviteMember('jean@exemple.com', 'admin')).rejects.toThrow(
      'Vous ne pouvez pas attribuer un rôle supérieur au vôtre'
    )
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('Test D (non autorisé) : getAdminContext throw propage l\'erreur, Clerk non appelé', async () => {
    mockMembershipFind.mockResolvedValue({ role: 'technician' })
    await expect(inviteMember('jean@exemple.com', 'technician')).rejects.toThrow()
    expect(mockCreate).not.toHaveBeenCalled()
  })
})

describe('revokeInvitation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue({ orgId: 'org_1', userId: 'u_admin' })
    mockOrgFind.mockResolvedValue({ id: 'orgUuid' })
    mockMembershipFind.mockResolvedValue({ role: 'admin' })
    mockRevoke.mockResolvedValue({ id: 'inv_1', status: 'revoked' })
  })

  it('Test E (happy path) : appelle revokeOrganizationInvitation avec les bons paramètres', async () => {
    await revokeInvitation('inv_1')
    expect(mockRevoke).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org_1',
        invitationId: 'inv_1',
        requestingUserId: 'u_admin',
      })
    )
  })

  it('Test F (non autorisé) : getAdminContext throw propage l\'erreur, Clerk non appelé', async () => {
    mockMembershipFind.mockResolvedValue({ role: 'technician' })
    await expect(revokeInvitation('inv_1')).rejects.toThrow()
    expect(mockRevoke).not.toHaveBeenCalled()
  })
})

describe('listPendingInvitations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue({ orgId: 'org_1', userId: 'u_admin' })
    mockOrgFind.mockResolvedValue({ id: 'orgUuid' })
    mockMembershipFind.mockResolvedValue({ role: 'admin' })
    mockList.mockResolvedValue({ data: [{ id: 'inv_1', emailAddress: 'jean@exemple.com', status: 'pending' }] })
  })

  it('happy path : retourne le tableau data des invitations en attente', async () => {
    const result = await listPendingInvitations()
    expect(mockList).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: 'org_1', status: ['pending'] })
    )
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ id: 'inv_1', emailAddress: 'jean@exemple.com' })
  })
})

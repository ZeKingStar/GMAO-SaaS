import { describe, it, expect } from 'vitest'
import { ROLE_ORDER, getAvailableRoles, canInviteWithRole, toClerkRole } from './invitation-roles'

describe('ROLE_ORDER', () => {
  it('contient les 5 rôles dans le bon ordre (du plus puissant au moins puissant)', () => {
    expect(ROLE_ORDER).toEqual(['admin', 'manager', 'technician', 'requester', 'viewer'])
  })
})

describe('getAvailableRoles', () => {
  it('Test 1 : admin peut attribuer les 5 rôles', () => {
    expect(getAvailableRoles('admin')).toEqual(['admin', 'manager', 'technician', 'requester', 'viewer'])
  })

  it('Test 2 : manager peut attribuer 4 rôles (pas admin)', () => {
    expect(getAvailableRoles('manager')).toEqual(['manager', 'technician', 'requester', 'viewer'])
  })

  it('Test 3 : technician peut attribuer 3 rôles', () => {
    expect(getAvailableRoles('technician')).toEqual(['technician', 'requester', 'viewer'])
  })
})

describe('canInviteWithRole', () => {
  it('Test 4 : manager ne peut PAS inviter avec rôle admin (escalade refusée D-06)', () => {
    expect(canInviteWithRole('manager', 'admin')).toBe(false)
  })

  it('Test 5 : manager peut inviter avec rôle technician', () => {
    expect(canInviteWithRole('manager', 'technician')).toBe(true)
  })

  it('Test 6 : admin peut inviter avec rôle admin (même niveau)', () => {
    expect(canInviteWithRole('admin', 'admin')).toBe(true)
  })
})

describe('toClerkRole', () => {
  it('Test 7 : retourne le rôle avec préfixe org:', () => {
    expect(toClerkRole('technician')).toBe('org:technician')
  })
})

import type { MemberRole } from '@/generated/prisma/enums'

// Du plus puissant (index 0) au moins puissant. Aligné sur ROLE_LABELS de team-table.tsx.
export const ROLE_ORDER: MemberRole[] = ['admin', 'manager', 'technician', 'requester', 'viewer']

// D-06 : un invitant ne peut attribuer que des rôles de rang ≤ au sien.
export function getAvailableRoles(currentRole: MemberRole): MemberRole[] {
  const idx = ROLE_ORDER.indexOf(currentRole)
  if (idx === -1) return []
  return ROLE_ORDER.slice(idx)
}

// D-06 enforcement (utilisé côté serveur ET pour filtrer le select UI).
export function canInviteWithRole(currentRole: MemberRole, target: MemberRole): boolean {
  const cur = ROLE_ORDER.indexOf(currentRole)
  const tgt = ROLE_ORDER.indexOf(target)
  if (cur === -1 || tgt === -1) return false
  return tgt >= cur
}

// Pitfall 3 RESEARCH.md : Clerk attend possiblement le préfixe `org:`.
// Si l'instance Clerk Korvia n'utilise PAS le préfixe, ajuster cette ligne uniquement.
export function toClerkRole(role: MemberRole): string {
  return `org:${role}`
}

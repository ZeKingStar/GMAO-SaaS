'use server'

import { getAuth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import type { MemberRole } from '@/generated/prisma/enums'

async function getAdminOrg() {
  const { orgId, userId } = await getAuth()
  if (!orgId || !userId) throw new Error('Non autorisé')

  const membership = await db.membership.findFirst({
    where: { userId, organizationId: orgId },
    select: { role: true },
  })
  if (!membership || (membership.role !== 'admin' && membership.role !== 'manager')) {
    throw new Error('Accès refusé')
  }

  return orgId
}

export async function updateOrganization(data: {
  name: string
  industry?: string
  size?: string
}) {
  const { orgId } = await getAuth()
  if (!orgId) throw new Error('Non autorisé')

  await db.organization.update({
    where: { id: orgId },
    data: {
      name: data.name.trim(),
      industry: data.industry?.trim() || null,
      size: data.size || null,
    },
  })
  revalidatePath('/parametres/organisation')
}

export async function updateMemberRole(membershipId: string, role: MemberRole) {
  const organizationId = await getAdminOrg()
  await db.membership.update({
    where: { id: membershipId, organizationId },
    data: { role },
  })
  revalidatePath('/parametres/organisation')
}

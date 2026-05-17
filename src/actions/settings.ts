'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import type { MemberRole } from '@/generated/prisma/enums'

async function getAdminOrg() {
  const { orgId, userId } = await auth()
  if (!orgId || !userId) throw new Error('Non autorisé')

  const org = await db.organization.findUnique({ where: { clerkId: orgId }, select: { id: true } })
  if (!org) throw new Error('Organisation introuvable')

  const membership = await db.membership.findFirst({
    where: { clerkUserId: userId, organizationId: org.id },
    select: { role: true },
  })
  if (!membership || (membership.role !== 'admin' && membership.role !== 'manager')) {
    throw new Error('Accès refusé')
  }

  return org.id
}

export async function updateOrganization(data: {
  name: string
  industry?: string
  size?: string
}) {
  const { orgId } = await auth()
  if (!orgId) throw new Error('Non autorisé')

  await db.organization.update({
    where: { clerkId: orgId },
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

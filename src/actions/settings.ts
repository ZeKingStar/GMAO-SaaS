'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import type { MemberRole } from '@/generated/prisma/enums'
import { type ClosureRequirements } from '@/lib/closure-requirements'
import { type EscalationConfig } from '@/lib/escalation-config'

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

export async function updateClosureRequirements(req: ClosureRequirements) {
  const organizationId = await getAdminOrg()

  // Coerce strict types avant persistance (defense-in-depth — l'UI envoie ces 3 bools)
  const sanitized: ClosureRequirements = {
    faultCode: !!req.faultCode,
    timeSpent: !!req.timeSpent,
    partsUsed: !!req.partsUsed,
  }

  await db.organization.update({
    where: { id: organizationId },
    data: { closureRequirements: sanitized },
  })
  revalidatePath('/parametres/organisation')
}

export async function updateMemberHourlyRate(membershipId: string, hourlyRate: number | null) {
  const organizationId = await getAdminOrg()

  if (hourlyRate !== null) {
    if (!Number.isFinite(hourlyRate) || hourlyRate < 0 || hourlyRate > 10000) {
      throw new Error('Taux horaire invalide')
    }
  }

  await db.membership.update({
    where: { id: membershipId, organizationId },
    data: { hourlyRate },
  })
  revalidatePath('/parametres/organisation')
}

export async function updateEscalationConfig(cfg: EscalationConfig) {
  const organizationId = await getAdminOrg()

  const enabled = !!cfg.enabled
  const delayHours = Number(cfg.delayHours)
  if (!Number.isFinite(delayHours) || delayHours <= 0 || delayHours > 168) {
    throw new Error('Délai invalide (entre 1 et 168 heures)')
  }

  const sanitized: EscalationConfig = { enabled, delayHours }

  await db.organization.update({
    where: { id: organizationId },
    data: { escalationConfig: sanitized },
  })
  revalidatePath('/parametres/organisation')
}

'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'

async function getOrganizationId() {
  const { orgId } = await auth()
  if (!orgId) throw new Error('Non autorisé')
  const org = await db.organization.findUnique({
    where: { clerkId: orgId },
    select: { id: true },
  })
  if (!org) throw new Error('Organisation introuvable')
  return org.id
}

export async function createSite(data: {
  name: string
  address?: string
  city?: string
  province?: string
  postalCode?: string
}) {
  const organizationId = await getOrganizationId()
  await db.site.create({ data: { organizationId, ...data } })
  revalidatePath('/actifs/sites')
}

export async function updateSite(
  id: string,
  data: {
    name: string
    address?: string
    city?: string
    province?: string
    postalCode?: string
  }
) {
  const organizationId = await getOrganizationId()
  await db.site.update({ where: { id, organizationId }, data })
  revalidatePath('/actifs/sites')
}

export async function deleteSite(id: string) {
  const organizationId = await getOrganizationId()
  await db.site.delete({ where: { id, organizationId } })
  revalidatePath('/actifs/sites')
}

export async function createLocation(data: {
  siteId: string
  parentId?: string
  name: string
}) {
  await getOrganizationId()
  await db.location.create({ data })
  revalidatePath('/actifs/sites')
}

export async function updateLocation(id: string, data: { name: string }) {
  await getOrganizationId()
  await db.location.update({ where: { id }, data })
  revalidatePath('/actifs/sites')
}

export async function deleteLocation(id: string) {
  await getOrganizationId()
  await db.location.delete({ where: { id } })
  revalidatePath('/actifs/sites')
}

async function requireAdminOrManager(organizationId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('Non autorisé')
  const membership = await db.membership.findFirst({
    where: { organizationId, clerkUserId: userId },
    select: { role: true },
  })
  if (!membership || !['admin', 'manager'].includes(membership.role)) {
    throw new Error('Permissions insuffisantes')
  }
}

export async function enablePortal(siteId: string): Promise<{ portalToken: string }> {
  const organizationId = await getOrganizationId()
  await requireAdminOrManager(organizationId)
  const existing = await db.site.findUnique({
    where: { id: siteId },
    select: { organizationId: true, portalToken: true },
  })
  if (!existing || existing.organizationId !== organizationId) {
    throw new Error('Site introuvable')
  }
  const portalToken = existing.portalToken ?? crypto.randomUUID()
  await db.site.update({
    where: { id: siteId },
    data: { portalToken, portalEnabled: true },
  })
  revalidatePath('/parametres/organisation')
  revalidatePath('/actifs/sites')
  return { portalToken }
}

export async function disablePortal(siteId: string): Promise<void> {
  const organizationId = await getOrganizationId()
  await requireAdminOrManager(organizationId)
  const existing = await db.site.findUnique({
    where: { id: siteId },
    select: { organizationId: true },
  })
  if (!existing || existing.organizationId !== organizationId) {
    throw new Error('Site introuvable')
  }
  await db.site.update({
    where: { id: siteId },
    data: { portalEnabled: false },
  })
  revalidatePath('/parametres/organisation')
  revalidatePath('/actifs/sites')
}

export async function regeneratePortalToken(siteId: string): Promise<{ portalToken: string }> {
  const organizationId = await getOrganizationId()
  await requireAdminOrManager(organizationId)
  const existing = await db.site.findUnique({
    where: { id: siteId },
    select: { organizationId: true },
  })
  if (!existing || existing.organizationId !== organizationId) {
    throw new Error('Site introuvable')
  }
  const portalToken = crypto.randomUUID()
  await db.site.update({
    where: { id: siteId },
    data: { portalToken },
  })
  revalidatePath('/parametres/organisation')
  revalidatePath('/actifs/sites')
  return { portalToken }
}

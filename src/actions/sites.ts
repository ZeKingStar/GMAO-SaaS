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

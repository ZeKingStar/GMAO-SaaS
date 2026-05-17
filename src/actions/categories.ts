'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'

async function getOrganizationId() {
  const { orgId } = await auth()
  if (!orgId) throw new Error('Non autorisé')
  const org = await db.organization.findUnique({ where: { clerkId: orgId }, select: { id: true } })
  if (!org) throw new Error('Organisation introuvable')
  return org.id
}

export async function createCategory(data: { name: string; icon?: string }) {
  const organizationId = await getOrganizationId()
  await db.assetCategory.create({ data: { organizationId, ...data } })
  revalidatePath('/actifs/categories')
}

export async function updateCategory(id: string, data: { name: string; icon?: string }) {
  const organizationId = await getOrganizationId()
  await db.assetCategory.update({ where: { id, organizationId }, data })
  revalidatePath('/actifs/categories')
}

export async function deleteCategory(id: string) {
  const organizationId = await getOrganizationId()
  await db.assetCategory.delete({ where: { id, organizationId } })
  revalidatePath('/actifs/categories')
}

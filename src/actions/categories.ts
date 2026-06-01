'use server'

import { getAuth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'

async function getOrganizationId() {
  const { orgId } = await getAuth()
  if (!orgId) throw new Error('Non autorisé')
  return orgId
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

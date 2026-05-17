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

export async function createAsset(data: {
  name: string
  categoryId?: string
  siteId?: string
  locationId?: string
  parentId?: string
  description?: string
  serialNumber?: string
  model?: string
  manufacturer?: string
  purchaseDate?: string
  warrantyExpiry?: string
}) {
  const organizationId = await getOrganizationId()
  await db.asset.create({
    data: {
      organizationId,
      name: data.name,
      categoryId: data.categoryId || null,
      siteId: data.siteId || null,
      locationId: data.locationId || null,
      parentId: data.parentId || null,
      description: data.description || null,
      serialNumber: data.serialNumber || null,
      model: data.model || null,
      manufacturer: data.manufacturer || null,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
      warrantyExpiry: data.warrantyExpiry ? new Date(data.warrantyExpiry) : null,
    },
  })
  revalidatePath('/actifs')
}

export async function updateAsset(id: string, data: {
  name: string
  categoryId?: string
  siteId?: string
  locationId?: string
  parentId?: string
  description?: string
  serialNumber?: string
  model?: string
  manufacturer?: string
  purchaseDate?: string
  warrantyExpiry?: string
  isActive?: boolean
}) {
  const organizationId = await getOrganizationId()
  await db.asset.update({
    where: { id, organizationId },
    data: {
      name: data.name,
      categoryId: data.categoryId || null,
      siteId: data.siteId || null,
      locationId: data.locationId || null,
      parentId: data.parentId || null,
      description: data.description || null,
      serialNumber: data.serialNumber || null,
      model: data.model || null,
      manufacturer: data.manufacturer || null,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
      warrantyExpiry: data.warrantyExpiry ? new Date(data.warrantyExpiry) : null,
      isActive: data.isActive ?? true,
    },
  })
  revalidatePath('/actifs')
}

export async function deleteAsset(id: string) {
  const organizationId = await getOrganizationId()
  await db.asset.delete({ where: { id, organizationId } })
  revalidatePath('/actifs')
}

export async function generateAssetQrCode(id: string) {
  const organizationId = await getOrganizationId()
  const { randomUUID } = await import('crypto')
  const qrCode = randomUUID()
  await db.asset.update({
    where: { id, organizationId },
    data: { qrCode },
  })
  revalidatePath('/actifs')
  return qrCode
}

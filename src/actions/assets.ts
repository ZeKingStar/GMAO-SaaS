'use server'

import { getAuth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'

async function getOrganizationId() {
  const { orgId } = await getAuth()
  if (!orgId) throw new Error('Non autorisé')
  return orgId
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
  meter?: { name: string; unit: string }
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
      meters: data.meter ? { create: [{ name: data.meter.name, unit: data.meter.unit }] } : undefined,
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
  meter?: { id?: string; name: string; unit: string } | null
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
  if (data.meter !== undefined) {
    if (data.meter === null) {
      await db.assetMeter.deleteMany({ where: { assetId: id } })
    } else if (data.meter.id) {
      await db.assetMeter.update({
        where: { id: data.meter.id },
        data: { name: data.meter.name, unit: data.meter.unit },
      })
    } else {
      await db.assetMeter.deleteMany({ where: { assetId: id } })
      await db.assetMeter.create({ data: { assetId: id, name: data.meter.name, unit: data.meter.unit } })
    }
  }
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

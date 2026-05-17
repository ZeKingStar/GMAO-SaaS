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

export async function createSparePart(data: {
  name: string
  partNumber?: string
  description?: string
  unit?: string
  quantityOnHand?: number
  quantityMin?: number
  unitCost?: number
  supplier?: string
  storageLocation?: string
}) {
  const organizationId = await getOrganizationId()
  await db.sparePart.create({
    data: {
      organizationId,
      name: data.name.trim(),
      partNumber: data.partNumber?.trim() || null,
      description: data.description?.trim() || null,
      unit: data.unit?.trim() || null,
      quantityOnHand: data.quantityOnHand ?? 0,
      quantityMin: data.quantityMin ?? null,
      unitCost: data.unitCost ?? null,
      supplier: data.supplier?.trim() || null,
      storageLocation: data.storageLocation?.trim() || null,
    },
  })
  revalidatePath('/inventaire')
}

export async function updateSparePart(id: string, data: {
  name: string
  partNumber?: string
  description?: string
  unit?: string
  quantityOnHand?: number
  quantityMin?: number | null
  unitCost?: number | null
  supplier?: string
  storageLocation?: string
}) {
  const organizationId = await getOrganizationId()
  await db.sparePart.update({
    where: { id, organizationId },
    data: {
      name: data.name.trim(),
      partNumber: data.partNumber?.trim() || null,
      description: data.description?.trim() || null,
      unit: data.unit?.trim() || null,
      quantityOnHand: data.quantityOnHand ?? 0,
      quantityMin: data.quantityMin ?? null,
      unitCost: data.unitCost ?? null,
      supplier: data.supplier?.trim() || null,
      storageLocation: data.storageLocation?.trim() || null,
    },
  })
  revalidatePath('/inventaire')
}

export async function adjustQuantity(id: string, delta: number) {
  const organizationId = await getOrganizationId()
  await db.sparePart.update({
    where: { id, organizationId },
    data: { quantityOnHand: { increment: delta } },
  })
  revalidatePath('/inventaire')
}

export async function deleteSparePart(id: string) {
  const organizationId = await getOrganizationId()
  await db.sparePart.delete({ where: { id, organizationId } })
  revalidatePath('/inventaire')
}

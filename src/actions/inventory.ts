'use server'

import { getAuth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { sendLowStockAlertEmail } from '@/lib/email'

async function getOrgAdminEmails(organizationId: string): Promise<string[]> {
  const admins = await db.membership.findMany({
    where: { organizationId, role: 'admin' },
    select: { email: true },
  })
  return admins.map((a: { email: string }) => a.email).filter((e: string): e is string => Boolean(e))
}

async function getOrganizationId() {
  const { orgId } = await getAuth()
  if (!orgId) throw new Error('Non autorisé')
  return orgId
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
  const { organizationId } = await getOrganizationId()
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
  const { organizationId, organizationName } = await getOrganizationId()

  // Read current state BEFORE update for threshold-crossing detection
  const before = await db.sparePart.findUnique({
    where: { id, organizationId },
    select: { quantityOnHand: true, quantityMin: true, name: true, partNumber: true },
  })

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

  // NOTIF-03: detect threshold crossing (above → at-or-below)
  const newQty = data.quantityOnHand ?? 0
  const newMin = data.quantityMin ?? null
  const effectiveMin = newMin ?? before?.quantityMin ?? null

  if (
    before &&
    effectiveMin !== null &&
    effectiveMin > 0 &&
    before.quantityOnHand >= effectiveMin &&
    newQty < effectiveMin
  ) {
    const adminEmails = await getOrgAdminEmails(organizationId)
    if (adminEmails.length > 0) {
      sendLowStockAlertEmail({
        to: adminEmails,
        partName: data.name.trim(),
        partNumber: data.partNumber?.trim() || before.partNumber || null,
        quantityOnHand: newQty,
        quantityMin: effectiveMin,
        organizationName,
      }).catch(err => console.error('[email] updateSparePart low-stock alert failed:', err))
    }
  }

  revalidatePath('/inventaire')
}

export async function adjustQuantity(id: string, delta: number) {
  const { organizationId, organizationName } = await getOrganizationId()

  // Read BEFORE update — Prisma increment doesn't return old value
  const before = await db.sparePart.findUnique({
    where: { id, organizationId },
    select: { quantityOnHand: true, quantityMin: true, name: true, partNumber: true },
  })

  const updated = await db.sparePart.update({
    where: { id, organizationId },
    data: { quantityOnHand: { increment: delta } },
    select: { quantityOnHand: true },
  })

  // NOTIF-03: detect threshold crossing (above → at-or-below)
  if (
    before &&
    before.quantityMin !== null &&
    before.quantityMin > 0 &&
    before.quantityOnHand >= before.quantityMin &&
    updated.quantityOnHand < before.quantityMin
  ) {
    const adminEmails = await getOrgAdminEmails(organizationId)
    if (adminEmails.length > 0) {
      sendLowStockAlertEmail({
        to: adminEmails,
        partName: before.name,
        partNumber: before.partNumber,
        quantityOnHand: updated.quantityOnHand,
        quantityMin: before.quantityMin,
        organizationName,
      }).catch(err => console.error('[email] adjustQuantity low-stock alert failed:', err))
    }
  }

  revalidatePath('/inventaire')
}

export async function deleteSparePart(id: string) {
  const { organizationId } = await getOrganizationId()
  await db.sparePart.delete({ where: { id, organizationId } })
  revalidatePath('/inventaire')
}

'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import type { MaintenanceTriggerType, MaintenanceFrequency, WorkOrderPriority } from '@/generated/prisma/enums'

async function getOrgAndMembership() {
  const { orgId, userId } = await auth()
  if (!orgId || !userId) throw new Error('Non autorisé')

  const org = await db.organization.findUnique({
    where: { clerkId: orgId },
    select: { id: true },
  })
  if (!org) throw new Error('Organisation introuvable')

  const membership = await db.membership.findFirst({
    where: { clerkUserId: userId, organizationId: org.id },
    select: { id: true },
  })
  if (!membership) throw new Error('Membre introuvable')

  return { organizationId: org.id, membershipId: membership.id }
}

export async function createMaintenancePlan(data: {
  name: string
  description?: string
  triggerType: MaintenanceTriggerType
  frequency?: MaintenanceFrequency
  customDays?: number
  customHours?: number
  meterThreshold?: number
  estimatedHours?: number
  priority: WorkOrderPriority
  assetId?: string
  categoryId?: string
  nextDueAt?: string
  tasks?: string[]
}) {
  const { organizationId } = await getOrgAndMembership()

  const { tasks, nextDueAt, ...rest } = data
  const plan = await db.maintenancePlan.create({
    data: {
      organizationId,
      ...rest,
      nextDueAt: nextDueAt ? new Date(nextDueAt) : undefined,
      tasks: tasks?.length
        ? {
            create: tasks.map((description, order) => ({ description, order })),
          }
        : undefined,
    },
  })

  revalidatePath('/maintenance')
  return plan
}

export async function updateMaintenancePlan(
  id: string,
  data: {
    name?: string
    description?: string
    triggerType?: MaintenanceTriggerType
    frequency?: MaintenanceFrequency | null
    customDays?: number | null
    customHours?: number | null
    meterThreshold?: number | null
    estimatedHours?: number | null
    priority?: WorkOrderPriority
    assetId?: string | null
    categoryId?: string | null
    nextDueAt?: string | null
  }
) {
  const { organizationId } = await getOrgAndMembership()
  const { nextDueAt, ...rest } = data

  await db.maintenancePlan.update({
    where: { id, organizationId },
    data: {
      ...rest,
      nextDueAt: nextDueAt === null ? null : nextDueAt ? new Date(nextDueAt) : undefined,
    },
  })

  revalidatePath('/maintenance')
}

export async function deleteMaintenancePlan(id: string) {
  const { organizationId } = await getOrgAndMembership()
  await db.maintenancePlan.delete({ where: { id, organizationId } })
  revalidatePath('/maintenance')
}

export async function toggleMaintenancePlan(id: string, isActive: boolean) {
  const { organizationId } = await getOrgAndMembership()
  await db.maintenancePlan.update({
    where: { id, organizationId },
    data: { isActive },
  })
  revalidatePath('/maintenance')
}

export async function addMaintenanceTask(planId: string, description: string) {
  const { organizationId } = await getOrgAndMembership()

  const plan = await db.maintenancePlan.findFirst({
    where: { id: planId, organizationId },
    select: { id: true },
  })
  if (!plan) throw new Error('Plan introuvable')

  const last = await db.maintenanceTask.findFirst({
    where: { maintenancePlanId: planId },
    orderBy: { order: 'desc' },
    select: { order: true },
  })

  await db.maintenanceTask.create({
    data: { maintenancePlanId: planId, description, order: (last?.order ?? -1) + 1 },
  })

  revalidatePath('/maintenance')
}

export async function deleteMaintenanceTask(taskId: string) {
  await getOrgAndMembership()
  await db.maintenanceTask.delete({ where: { id: taskId } })
  revalidatePath('/maintenance')
}

/**
 * Pure business logic — creates a work order from a maintenance plan.
 * No auth() dependency: organizationId is passed explicitly.
 * Intended for use by cron jobs and server-side contexts without a session.
 */
export async function generateWorkOrderFromPlanInternal(planId: string, organizationId: string) {
  const plan = await db.maintenancePlan.findFirst({
    where: { id: planId, organizationId },
    include: {
      tasks: { orderBy: { order: 'asc' } },
      planParts: true,
    },
  })
  if (!plan) throw new Error('Plan introuvable')

  const last = await db.workOrder.findFirst({
    where: { organizationId },
    orderBy: { number: 'desc' },
    select: { number: true },
  })
  const number = (last?.number ?? 0) + 1

  const wo = await db.workOrder.create({
    data: {
      organizationId,
      number,
      title: plan.name,
      description: plan.description ?? undefined,
      type: 'preventive',
      priority: plan.priority,
      estimatedHours: plan.estimatedHours ?? undefined,
      assetId: plan.assetId ?? undefined,
      maintenancePlanId: planId,
      checklistItems: plan.tasks.length > 0 ? {
        create: plan.tasks.map(t => ({
          order: t.order,
          description: t.description,
        })),
      } : undefined,
      parts: plan.planParts.length > 0 ? {
        create: plan.planParts.map(p => ({
          sparePartId: p.sparePartId ?? null,
          name: p.name,
          quantity: p.quantity,
        })),
      } : undefined,
    },
    select: { id: true, number: true },
  })

  await db.maintenancePlan.update({
    where: { id: planId },
    data: { lastGeneratedAt: new Date() },
  })

  return wo
}

export async function generateWorkOrderFromPlan(planId: string) {
  const { organizationId } = await getOrgAndMembership()
  const wo = await generateWorkOrderFromPlanInternal(planId, organizationId)
  revalidatePath('/bons-de-travail')
  revalidatePath('/maintenance')
  return wo
}

export async function addPlanPart(planId: string, data: {
  sparePartId?: string | null
  name: string
  quantity: number
}) {
  const { organizationId } = await getOrgAndMembership()

  const plan = await db.maintenancePlan.findFirst({
    where: { id: planId, organizationId },
    select: { id: true },
  })
  if (!plan) throw new Error('Plan introuvable')

  if (!data.name.trim()) throw new Error('Nom de pièce requis')
  if (!Number.isFinite(data.quantity) || data.quantity <= 0) throw new Error('Quantité invalide')

  await db.maintenancePlanPart.create({
    data: {
      maintenancePlanId: planId,
      sparePartId: data.sparePartId || null,
      name: data.name.trim(),
      quantity: data.quantity,
    },
  })
  revalidatePath('/maintenance')
}

export async function deletePlanPart(partId: string) {
  const { organizationId } = await getOrgAndMembership()

  const part = await db.maintenancePlanPart.findFirst({
    where: { id: partId, maintenancePlan: { organizationId } },
    select: { id: true },
  })
  if (!part) throw new Error('Pièce introuvable')

  await db.maintenancePlanPart.delete({ where: { id: partId } })
  revalidatePath('/maintenance')
}

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

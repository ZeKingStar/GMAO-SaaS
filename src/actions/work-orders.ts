'use server'

import { getAuth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import type { WorkOrderType, WorkOrderStatus, WorkOrderPriority } from '@/generated/prisma/enums'

async function getOrgAndMembership() {
  const { orgId, userId } = await getAuth()
  if (!orgId || !userId) throw new Error('Non autorisé')

  const membership = await db.membership.findFirst({
    where: { userId, organizationId: orgId },
    select: { id: true },
  })
  if (!membership) throw new Error('Membre introuvable')

  return { organizationId: orgId, membershipId: membership.id }
}

export async function createWorkOrder(data: {
  title: string
  description?: string
  type: WorkOrderType
  priority: WorkOrderPriority
  siteId?: string
  assetId?: string
  dueDate?: string
  estimatedHours?: number
  assigneeIds?: string[]
}) {
  const { organizationId } = await getOrgAndMembership()

  const last = await db.workOrder.findFirst({
    where: { organizationId },
    orderBy: { number: 'desc' },
    select: { number: true },
  })
  const number = (last?.number ?? 0) + 1

  const { assigneeIds, dueDate, ...rest } = data
  const wo = await db.workOrder.create({
    data: {
      organizationId,
      number,
      ...rest,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      assignees: assigneeIds?.length
        ? { create: assigneeIds.map(membershipId => ({ membershipId })) }
        : undefined,
    },
  })

  revalidatePath('/bons-de-travail')
  return wo
}

export async function updateWorkOrder(
  id: string,
  data: {
    title?: string
    description?: string
    type?: WorkOrderType
    priority?: WorkOrderPriority
    siteId?: string | null
    assetId?: string | null
    dueDate?: string | null
    estimatedHours?: number | null
  }
) {
  const { organizationId } = await getOrgAndMembership()
  const { dueDate, ...rest } = data

  await db.workOrder.update({
    where: { id, organizationId },
    data: {
      ...rest,
      dueDate: dueDate === null ? null : dueDate ? new Date(dueDate) : undefined,
    },
  })

  revalidatePath('/bons-de-travail')
  revalidatePath(`/bons-de-travail/${id}`)
}

export async function updateWorkOrderStatus(
  id: string,
  status: WorkOrderStatus,
  closureNotes?: string
) {
  const { organizationId } = await getOrgAndMembership()

  const extra: Record<string, unknown> = {}
  if (status === 'in_progress') extra.startedAt = new Date()
  if (status === 'resolved' || status === 'closed') extra.completedAt = new Date()
  if (closureNotes) extra.closureNotes = closureNotes

  await db.workOrder.update({
    where: { id, organizationId },
    data: { status, ...extra },
  })

  revalidatePath('/bons-de-travail')
  revalidatePath(`/bons-de-travail/${id}`)
}

export async function deleteWorkOrder(id: string) {
  const { organizationId } = await getOrgAndMembership()
  await db.workOrder.delete({ where: { id, organizationId } })
  revalidatePath('/bons-de-travail')
}

export async function assignMember(workOrderId: string, membershipId: string) {
  await getOrgAndMembership()
  await db.workOrderAssignee.upsert({
    where: { workOrderId_membershipId: { workOrderId, membershipId } },
    create: { workOrderId, membershipId },
    update: {},
  })
  revalidatePath(`/bons-de-travail/${workOrderId}`)
}

export async function unassignMember(workOrderId: string, membershipId: string) {
  await getOrgAndMembership()
  await db.workOrderAssignee.delete({
    where: { workOrderId_membershipId: { workOrderId, membershipId } },
  })
  revalidatePath(`/bons-de-travail/${workOrderId}`)
}

export async function addComment(workOrderId: string, content: string) {
  const { membershipId } = await getOrgAndMembership()
  await db.workOrderComment.create({
    data: { workOrderId, membershipId, content },
  })
  revalidatePath(`/bons-de-travail/${workOrderId}`)
}

export async function deleteComment(workOrderId: string, commentId: string) {
  const { membershipId } = await getOrgAndMembership()
  await db.workOrderComment.delete({
    where: { id: commentId, membershipId },
  })
  revalidatePath(`/bons-de-travail/${workOrderId}`)
}

export async function logTime(
  workOrderId: string,
  data: { startedAt: string; endedAt: string; notes?: string }
) {
  const { membershipId } = await getOrgAndMembership()
  const startedAt = new Date(data.startedAt)
  const endedAt = new Date(data.endedAt)
  const minutes = Math.round((endedAt.getTime() - startedAt.getTime()) / 60000)

  await db.workOrderTimeLog.create({
    data: { workOrderId, membershipId, startedAt, endedAt, minutes, notes: data.notes },
  })
  revalidatePath(`/bons-de-travail/${workOrderId}`)
}

'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import type { WorkOrderType, WorkOrderStatus, WorkOrderPriority } from '@/generated/prisma/enums'
import { sendWorkOrderAssignedEmail } from '@/lib/email'

async function getOrgAndMembership() {
  const { orgId, userId } = await auth()
  if (!orgId || !userId) throw new Error('Non autorisé')

  const org = await db.organization.findUnique({
    where: { clerkId: orgId },
    select: { id: true, name: true },
  })
  if (!org) throw new Error('Organisation introuvable')

  const membership = await db.membership.findFirst({
    where: { clerkUserId: userId, organizationId: org.id },
    select: { id: true },
  })
  if (!membership) throw new Error('Membre introuvable')

  return { organizationId: org.id, membershipId: membership.id, organizationName: org.name }
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
  const { organizationId, organizationName } = await getOrgAndMembership()

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

  // NOTIF-01: notify assignees — fire-and-forget, must not block or throw
  if (assigneeIds?.length) {
    const assignees = await db.workOrderAssignee.findMany({
      where: { workOrderId: wo.id },
      include: {
        membership: {
          select: { email: true, firstName: true, lastName: true },
        },
      },
    })
    Promise.allSettled(
      assignees
        .filter(a => a.membership.email)
        .map(a =>
          sendWorkOrderAssignedEmail({
            to: a.membership.email,
            recipientName: [a.membership.firstName, a.membership.lastName].filter(Boolean).join(' ') || a.membership.email,
            workOrderNumber: wo.number,
            workOrderTitle: wo.title,
            workOrderPriority: wo.priority,
            dueDate: wo.dueDate ?? null,
            organizationName,
          }).catch(err => console.error('[email] createWorkOrder notification failed:', err))
        )
    )
  }

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
  const { organizationName } = await getOrgAndMembership()

  await db.workOrderAssignee.upsert({
    where: { workOrderId_membershipId: { workOrderId, membershipId } },
    create: { workOrderId, membershipId },
    update: {},
  })

  // NOTIF-01: notify newly assigned member — fire-and-forget
  const [member, workOrder] = await Promise.all([
    db.membership.findUnique({
      where: { id: membershipId },
      select: { email: true, firstName: true, lastName: true },
    }),
    db.workOrder.findUnique({
      where: { id: workOrderId },
      select: { number: true, title: true, priority: true, dueDate: true },
    }),
  ])

  if (member?.email && workOrder) {
    sendWorkOrderAssignedEmail({
      to: member.email,
      recipientName: [member.firstName, member.lastName].filter(Boolean).join(' ') || member.email,
      workOrderNumber: workOrder.number,
      workOrderTitle: workOrder.title,
      workOrderPriority: workOrder.priority,
      dueDate: workOrder.dueDate ?? null,
      organizationName,
    }).catch(err => console.error('[email] assignMember notification failed:', err))
  }

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

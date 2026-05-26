'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import type { WorkOrderType, WorkOrderStatus, WorkOrderPriority } from '@/generated/prisma/enums'
import { sendWorkOrderAssignedEmail } from '@/lib/email'
import { validateClosure, parseClosureRequirements } from '@/lib/closure-requirements'

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

  // Validation TERRAIN-01 : si on passe à resolved/closed, vérifier closureRequirements
  if (status === 'resolved' || status === 'closed') {
    const [wo, org] = await Promise.all([
      db.workOrder.findFirst({
        where: { id, organizationId },
        select: {
          faultCategory: true,
          faultProblem: true,
          faultCause: true,
          faultRemedy: true,
          timeLogs: { select: { minutes: true } },
          parts: { select: { id: true } },
        },
      }),
      db.organization.findUnique({
        where: { id: organizationId },
        select: { closureRequirements: true },
      }),
    ])
    if (!wo) throw new Error('Bon de travail introuvable')

    const req = parseClosureRequirements(org?.closureRequirements)
    const timeLogsMinutesTotal = wo.timeLogs.reduce((sum, l) => sum + (l.minutes ?? 0), 0)
    const missing = validateClosure(
      {
        faultCategory: wo.faultCategory,
        faultProblem: wo.faultProblem,
        timeLogsMinutesTotal,
        partsCount: wo.parts.length,
      },
      req
    )
    if (missing.length > 0) {
      throw new Error(`Champs requis manquants pour clôture: ${missing.join(', ')}`)
    }
  }

  const extra: Record<string, unknown> = {}
  if (status === 'in_progress') extra.startedAt = new Date()
  if (status === 'resolved' || status === 'closed') extra.completedAt = new Date()
  if (closureNotes !== undefined) extra.closureNotes = closureNotes

  await db.workOrder.update({
    where: { id, organizationId },
    data: { status, ...extra },
  })

  revalidatePath('/bons-de-travail')
  revalidatePath(`/bons-de-travail/${id}`)
}

export async function setWorkOrderFault(
  workOrderId: string,
  data: {
    faultCategory: string | null
    faultProblem: string | null
    faultCause: string | null
    faultRemedy: string | null
  }
) {
  const { organizationId } = await getOrgAndMembership()
  await db.workOrder.update({
    where: { id: workOrderId, organizationId },
    data: {
      faultCategory: data.faultCategory?.trim() || null,
      faultProblem: data.faultProblem?.trim() || null,
      faultCause: data.faultCause?.trim() || null,
      faultRemedy: data.faultRemedy?.trim() || null,
    },
  })
  revalidatePath(`/bons-de-travail/${workOrderId}`)
}

export async function startTimer(workOrderId: string) {
  const { organizationId, membershipId } = await getOrgAndMembership()

  // Vérifier que le BT appartient à l'org
  const wo = await db.workOrder.findFirst({
    where: { id: workOrderId, organizationId },
    select: { id: true },
  })
  if (!wo) throw new Error('Bon de travail introuvable')

  // Refuser si une session ouverte existe déjà pour ce membre sur ce BT
  const active = await db.workOrderTimeLog.findFirst({
    where: { workOrderId, membershipId, endedAt: null },
    select: { id: true },
  })
  if (active) throw new Error('Une session est déjà active sur ce bon')

  const log = await db.workOrderTimeLog.create({
    data: { workOrderId, membershipId, startedAt: new Date() },
    select: { id: true, startedAt: true },
  })
  revalidatePath(`/bons-de-travail/${workOrderId}`)
  return { timeLogId: log.id, startedAt: log.startedAt }
}

export async function stopTimer(timeLogId: string) {
  const { membershipId } = await getOrgAndMembership()
  const log = await db.workOrderTimeLog.findFirst({
    where: { id: timeLogId, membershipId, endedAt: null },
    select: { id: true, workOrderId: true, startedAt: true },
  })
  if (!log) throw new Error('Session active introuvable')

  const endedAt = new Date()
  const minutes = Math.max(0, Math.round((endedAt.getTime() - log.startedAt.getTime()) / 60000))

  await db.workOrderTimeLog.update({
    where: { id: timeLogId },
    data: { endedAt, minutes },
  })
  revalidatePath(`/bons-de-travail/${log.workOrderId}`)
  return { minutes }
}

export async function closeActiveTimer(timeLogId: string) {
  const { orgId, userId } = await auth()
  if (!orgId || !userId) throw new Error('Non autorisé')
  const org = await db.organization.findUnique({ where: { clerkId: orgId }, select: { id: true } })
  if (!org) throw new Error('Organisation introuvable')
  const me = await db.membership.findFirst({
    where: { clerkUserId: userId, organizationId: org.id },
    select: { role: true },
  })
  if (!me || (me.role !== 'admin' && me.role !== 'manager')) throw new Error('Accès refusé')

  const log = await db.workOrderTimeLog.findFirst({
    where: { id: timeLogId, endedAt: null, workOrder: { organizationId: org.id } },
    select: { id: true, workOrderId: true, startedAt: true },
  })
  if (!log) throw new Error('Session active introuvable')

  const endedAt = new Date()
  const minutes = Math.max(0, Math.round((endedAt.getTime() - log.startedAt.getTime()) / 60000))
  await db.workOrderTimeLog.update({ where: { id: timeLogId }, data: { endedAt, minutes } })
  revalidatePath(`/bons-de-travail/${log.workOrderId}`)
}

export async function upsertWorkOrderPart(
  workOrderId: string,
  data: { id?: string; sparePartId?: string | null; name: string; quantity: number }
) {
  const { organizationId } = await getOrgAndMembership()
  const wo = await db.workOrder.findFirst({
    where: { id: workOrderId, organizationId },
    select: { id: true, status: true },
  })
  if (!wo) throw new Error('Bon de travail introuvable')
  if (wo.status === 'closed' || wo.status === 'resolved') throw new Error('Impossible de modifier les pièces d\'un bon de travail fermé')
  if (!data.name.trim()) throw new Error('Nom de pièce requis')
  if (!Number.isFinite(data.quantity) || data.quantity <= 0) throw new Error('Quantité invalide')

  // Si lié à inventaire, hydrater name+unitCost+vérifier appartenance org
  let sparePartUnitCost: number | null = null
  let resolvedName = data.name.trim()
  if (data.sparePartId) {
    const sp = await db.sparePart.findFirst({
      where: { id: data.sparePartId, organizationId },
      select: { id: true, name: true, unitCost: true, quantityOnHand: true },
    })
    if (!sp) throw new Error('Pièce inventaire introuvable')
    if (!data.id && sp.quantityOnHand < data.quantity) throw new Error(`Stock insuffisant — disponible : ${sp.quantityOnHand}`)
    sparePartUnitCost = sp.unitCost ?? null
    resolvedName = sp.name
  }

  if (data.id) {
    // Update : pas de réajustement de stock automatique (compromis de simplicité Phase 6)
    const existing = await db.workOrderPart.findFirst({
      where: { id: data.id, workOrderId },
      select: { id: true },
    })
    if (!existing) throw new Error('Pièce de BT introuvable')
    await db.workOrderPart.update({
      where: { id: data.id },
      data: {
        sparePartId: data.sparePartId ?? null,
        name: resolvedName,
        quantity: data.quantity,
        unitCost: sparePartUnitCost,
      },
    })
  } else {
    // Create + décrément de stock si lié à inventaire (D-07)
    await db.$transaction(async tx => {
      await tx.workOrderPart.create({
        data: {
          workOrderId,
          sparePartId: data.sparePartId ?? null,
          name: resolvedName,
          quantity: data.quantity,
          unitCost: sparePartUnitCost,
        },
      })
      if (data.sparePartId) {
        await tx.sparePart.update({
          where: { id: data.sparePartId },
          data: { quantityOnHand: { decrement: data.quantity } },
        })
      }
    })
  }
  revalidatePath(`/bons-de-travail/${workOrderId}`)
}

export async function deleteWorkOrderPart(workOrderId: string, partId: string) {
  const { organizationId } = await getOrgAndMembership()
  const part = await db.workOrderPart.findFirst({
    where: { id: partId, workOrderId, workOrder: { organizationId } },
    select: { id: true },
  })
  if (!part) throw new Error('Pièce introuvable')
  await db.workOrderPart.delete({ where: { id: partId } })
  revalidatePath(`/bons-de-travail/${workOrderId}`)
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

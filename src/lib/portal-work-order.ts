import { db } from '@/lib/db'
import type { PortalSubmitInput } from '@/lib/portal-validation'

export interface CreatePortalWorkOrderParams {
  organizationId: string
  siteId: string
  input: Omit<PortalSubmitInput, 'honeypot'>
}

export async function createPortalWorkOrder({ organizationId, siteId, input }: CreatePortalWorkOrderParams) {
  const last = await db.workOrder.findFirst({
    where: { organizationId },
    orderBy: { number: 'desc' },
    select: { number: true },
  })
  const number = (last?.number ?? 0) + 1

  const title = `Demande portail — ${input.requesterName}`.slice(0, 120)
  const description = [
    `Demandeur: ${input.requesterName} <${input.requesterEmail}>`,
    input.locationDescription ? `Localisation: ${input.locationDescription}` : null,
    '',
    input.description,
  ].filter(Boolean).join('\n')

  const wo = await db.workOrder.create({
    data: {
      organizationId,
      siteId,
      number,
      title,
      description,
      type: 'service_request',
      status: 'open',
      priority: 'medium',
    },
    select: {
      id: true,
      number: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      type: true,
      siteId: true,
      organizationId: true,
      createdAt: true,
    },
  })
  return wo
}

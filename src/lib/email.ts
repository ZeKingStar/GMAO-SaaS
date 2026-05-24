import { Resend } from 'resend'
import { render } from '@react-email/render'
import { WorkOrderAssignedEmail } from '@/emails/work-order-assigned'
import { MaintenanceReminderEmail } from '@/emails/maintenance-reminder'
import { LowStockAlertEmail } from '@/emails/low-stock-alert'
import { PortalConfirmationEmail } from '@/emails/portal-confirmation'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = process.env.RESEND_FROM_EMAIL ?? 'Korvia <notifications@korvia.app>'

export async function sendWorkOrderAssignedEmail(params: {
  to: string
  recipientName: string
  workOrderNumber: number
  workOrderTitle: string
  workOrderPriority: string
  dueDate?: Date | null
  organizationName: string
}): Promise<void> {
  const html = await render(WorkOrderAssignedEmail(params))
  await resend.emails.send({
    from: FROM,
    to: [params.to],
    subject: `[Korvia] Bon de travail #${params.workOrderNumber} — ${params.workOrderTitle}`,
    html,
  })
}

export async function sendMaintenanceReminderEmail(params: {
  to: string[]
  planName: string
  assetName?: string | null
  nextDueAt: Date
  organizationName: string
}): Promise<void> {
  const html = await render(MaintenanceReminderEmail(params))
  await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: `[Korvia] Rappel maintenance — ${params.planName} dans 48h`,
    html,
  })
}

export async function sendLowStockAlertEmail(params: {
  to: string[]
  partName: string
  partNumber?: string | null
  quantityOnHand: number
  quantityMin: number
  organizationName: string
}): Promise<void> {
  const html = await render(LowStockAlertEmail(params))
  await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: `[Korvia] Alerte stock faible — ${params.partName}`,
    html,
  })
}

export async function sendPortalConfirmationEmail(params: {
  to: string
  requesterName: string
  workOrderNumber: number
  siteName: string
  organizationName: string
}): Promise<void> {
  const html = await render(PortalConfirmationEmail(params))
  await resend.emails.send({
    from: FROM,
    to: [params.to],
    subject: `[Korvia] Votre demande #${params.workOrderNumber} a été reçue`,
    html,
  })
}

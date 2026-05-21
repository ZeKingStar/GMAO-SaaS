import { Resend } from 'resend'
import { renderToStaticMarkup } from 'react-dom/server'
import { WorkOrderAssignedEmail } from '@/emails/work-order-assigned'
import { MaintenanceReminderEmail } from '@/emails/maintenance-reminder'
import { LowStockAlertEmail } from '@/emails/low-stock-alert'

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
  const html = renderToStaticMarkup(WorkOrderAssignedEmail(params))
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
  const html = renderToStaticMarkup(MaintenanceReminderEmail(params))
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
  const html = renderToStaticMarkup(LowStockAlertEmail(params))
  await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: `[Korvia] Alerte stock faible — ${params.partName}`,
    html,
  })
}

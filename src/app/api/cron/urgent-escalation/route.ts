/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parseEscalationConfig } from '@/lib/escalation-config'
import { sendUrgentEscalationEmail } from '@/lib/email'

export async function GET(request: NextRequest) {
  // Auth — pattern identique à maintenance-reminder
  const authHeader = request.headers.get('authorization')
  const expectedToken = process.env.CRON_SECRET

  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const now = new Date()

  // 1. Charger toutes les organisations qui ont une config escalade non-null
  // Utilise `as any` car escalationConfig est dans le schéma Prisma mais le
  // client généré dans ce worktree n'est pas encore régénéré (08-01 pré-requis)
  const orgs: Array<{
    id: string
    name: string
    escalationConfig: unknown
    members: Array<{ email: string }>
  }> = await (db as any).organization.findMany({
    where: { escalationConfig: { not: undefined } },
    select: {
      id: true,
      name: true,
      escalationConfig: true,
      members: {
        where: { role: { in: ['admin', 'manager'] } },
        select: { email: true },
      },
    },
  })

  let totalFound = 0
  let totalSent = 0
  const errors: string[] = []

  for (const org of orgs) {
    const cfg = parseEscalationConfig(org.escalationConfig)
    if (!cfg.enabled) continue

    const recipients = org.members.map((m) => m.email).filter((e): e is string => !!e)
    if (recipients.length === 0) continue

    const threshold = new Date(now.getTime() - cfg.delayHours * 60 * 60 * 1000)

    // Filtre les BTs urgents non résolus et non escaladés dépassant le délai
    const overdueWOs: Array<{
      id: string
      number: number
      title: string
      createdAt: Date
    }> = await (db as any).workOrder.findMany({
      where: {
        organizationId: org.id,
        priority: 'urgent',
        status: { in: ['open', 'in_progress', 'on_hold'] },
        createdAt: { lte: threshold },
        escalationSentAt: null,
      },
      select: { id: true, number: true, title: true, createdAt: true },
    })

    totalFound += overdueWOs.length

    for (const wo of overdueWOs) {
      const ageMs = now.getTime() - wo.createdAt.getTime()
      const ageHours = Math.floor(ageMs / (60 * 60 * 1000))
      try {
        await sendUrgentEscalationEmail({
          to: recipients,
          workOrderNumber: wo.number,
          workOrderTitle: wo.title,
          workOrderId: wo.id,
          createdAt: wo.createdAt,
          ageHours,
          organizationName: org.name,
        })
        // Marquer comme escaladé pour idempotence
        await (db as any).workOrder.update({
          where: { id: wo.id },
          data: { escalationSentAt: new Date() },
        })
        totalSent++
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        errors.push(`WO ${wo.id} (org ${org.id}): ${msg}`)
        console.error('[cron/urgent-escalation] failed for WO', wo.id, err)
      }
    }
  }

  console.log(`[cron/urgent-escalation] orgs=${orgs.length} found=${totalFound} sent=${totalSent}`)

  return NextResponse.json({
    ok: true,
    orgsProcessed: orgs.length,
    workOrdersFound: totalFound,
    emailsSent: totalSent,
    errors: errors.length > 0 ? errors : undefined,
  })
}

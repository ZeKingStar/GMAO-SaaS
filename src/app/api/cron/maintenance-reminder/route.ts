import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendMaintenanceReminderEmail } from '@/lib/email'

export async function GET(request: NextRequest) {
  // Verify Vercel Cron secret
  const authHeader = request.headers.get('authorization')
  const expectedToken = process.env.CRON_SECRET

  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const now = new Date()
  const windowStart = new Date(now.getTime() + 47 * 60 * 60 * 1000)  // now + 47h
  const windowEnd = new Date(now.getTime() + 49 * 60 * 60 * 1000)    // now + 49h

  // Find active maintenance plans due in the 47-49h window
  const plans = await db.maintenancePlan.findMany({
    where: {
      isActive: true,
      nextDueAt: {
        gte: windowStart,
        lte: windowEnd,
      },
    },
    include: {
      organization: {
        select: {
          name: true,
          members: {
            where: { role: 'admin' },
            select: { email: true },
          },
        },
      },
      asset: {
        select: { name: true },
      },
    },
  })

  let sent = 0
  const errors: string[] = []

  for (const plan of plans) {
    const adminEmails = plan.organization.members
      .map(m => m.email)
      .filter(Boolean)

    if (adminEmails.length === 0) {
      // No admins with email — skip silently
      continue
    }

    if (!plan.nextDueAt) {
      continue
    }

    try {
      await sendMaintenanceReminderEmail({
        to: adminEmails,
        planName: plan.name,
        assetName: plan.asset?.name ?? null,
        nextDueAt: plan.nextDueAt,
        organizationName: plan.organization.name,
      })
      sent++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`Plan ${plan.id}: ${msg}`)
      console.error('[cron/maintenance-reminder] email failed for plan', plan.id, err)
    }
  }

  console.log(`[cron/maintenance-reminder] processed ${plans.length} plans, sent ${sent} emails`)

  return NextResponse.json({
    ok: true,
    plansFound: plans.length,
    emailsSent: sent,
    errors: errors.length > 0 ? errors : undefined,
  })
}

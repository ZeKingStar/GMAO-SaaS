import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateWorkOrderFromPlanInternal } from '@/actions/maintenance'

export async function GET(request: NextRequest) {
  // Auth — identical pattern to maintenance-reminder and urgent-escalation
  const authHeader = request.headers.get('authorization')
  const expectedToken = process.env.CRON_SECRET

  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  // Fetch all active meter_based plans that have both an asset and a threshold value
  const plans = await db.maintenancePlan.findMany({
    where: {
      isActive: true,
      triggerType: 'meter_based',
      nextMeterValue: { not: null },
      assetId: { not: null },
    },
    include: { asset: { include: { meters: { take: 1 } } } },
  })

  let triggered = 0
  const errors: string[] = []

  for (const plan of plans) {
    const meter = plan.asset?.meters[0]
    if (!meter || plan.nextMeterValue == null) continue

    // Skip if asset has not yet reached the threshold
    if (meter.value < plan.nextMeterValue) continue

    // Guard idempotence — CRITICAL: prevent creating one WO per hour when threshold is exceeded
    const existing = await db.workOrder.findFirst({
      where: {
        maintenancePlanId: plan.id,
        status: { in: ['open', 'in_progress', 'on_hold'] },
      },
      select: { id: true },
    })
    if (existing) continue

    try {
      await generateWorkOrderFromPlanInternal(plan.id, plan.organizationId)

      // Advance nextMeterValue so the next WO will only trigger after another meterThreshold units
      if (plan.meterThreshold != null) {
        await db.maintenancePlan.update({
          where: { id: plan.id },
          data: { nextMeterValue: meter.value + plan.meterThreshold },
        })
      }

      triggered++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`Plan ${plan.id}: ${msg}`)
      console.error('[cron/meter-threshold-check] failed for plan', plan.id, err)
    }
  }

  console.log(
    `[cron/meter-threshold-check] plansChecked=${plans.length} triggered=${triggered}`,
  )

  return NextResponse.json({
    ok: true,
    plansChecked: plans.length,
    triggered,
    errors: errors.length > 0 ? errors : undefined,
  })
}

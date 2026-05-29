import { db } from '@/lib/db'

/**
 * Updates an asset's meter value and recalculates nextMeterValue
 * for all meter_based maintenance plans linked to the asset.
 *
 * Returns the meter record, or null if no meter is found for the asset.
 */
export async function updateMeterAndPlans(
  assetId: string,
  organizationId: string,
  reading: number,
) {
  const meter = await db.assetMeter.findFirst({ where: { assetId } })
  if (!meter) return null

  await db.assetMeter.update({ where: { id: meter.id }, data: { value: reading } })

  const plans = await db.maintenancePlan.findMany({
    where: { assetId, organizationId, triggerType: 'meter_based' },
    select: { id: true, meterThreshold: true },
  })

  for (const plan of plans) {
    if (plan.meterThreshold != null) {
      await db.maintenancePlan.update({
        where: { id: plan.id },
        data: { nextMeterValue: reading + plan.meterThreshold },
      })
    }
  }

  return meter
}

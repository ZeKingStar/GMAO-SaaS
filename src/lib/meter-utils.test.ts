/**
 * Unit tests for meter-utils — Phase 9 COND-01
 *
 * Tests the updateMeterAndPlans helper:
 * - Updates AssetMeter.value
 * - Recalculates nextMeterValue for meter_based plans
 * - Returns null when no meter found
 * - Ignores plans with null meterThreshold
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { updateMeterAndPlans } from '@/lib/meter-utils'

// Mock @/lib/db
vi.mock('@/lib/db', () => ({
  db: {
    assetMeter: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    maintenancePlan: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}))

import { db } from '@/lib/db'

const mockDb = db as unknown as {
  assetMeter: {
    findFirst: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }
  maintenancePlan: {
    findMany: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }
}

describe('updateMeterAndPlans', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('Test 1: appelle db.assetMeter.update avec la nouvelle valeur pour le premier compteur', async () => {
    const fakeMeter = { id: 'meter-1', assetId: 'asset-1', name: 'Heures', unit: 'h', value: 100 }
    mockDb.assetMeter.findFirst.mockResolvedValue(fakeMeter)
    mockDb.assetMeter.update.mockResolvedValue({ ...fakeMeter, value: 250 })
    mockDb.maintenancePlan.findMany.mockResolvedValue([])

    await updateMeterAndPlans('asset-1', 'org-1', 250)

    expect(mockDb.assetMeter.update).toHaveBeenCalledWith({
      where: { id: 'meter-1' },
      data: { value: 250 },
    })
  })

  it('Test 2: recalcule nextMeterValue = reading + meterThreshold pour chaque plan meter_based', async () => {
    const fakeMeter = { id: 'meter-1', assetId: 'asset-1', name: 'Heures', unit: 'h', value: 100 }
    const fakePlans = [
      { id: 'plan-1', meterThreshold: 500 },
      { id: 'plan-2', meterThreshold: 250 },
    ]
    mockDb.assetMeter.findFirst.mockResolvedValue(fakeMeter)
    mockDb.assetMeter.update.mockResolvedValue({ ...fakeMeter, value: 1000 })
    mockDb.maintenancePlan.findMany.mockResolvedValue(fakePlans)
    mockDb.maintenancePlan.update.mockResolvedValue({})

    await updateMeterAndPlans('asset-1', 'org-1', 1000)

    expect(mockDb.maintenancePlan.update).toHaveBeenCalledTimes(2)
    expect(mockDb.maintenancePlan.update).toHaveBeenCalledWith({
      where: { id: 'plan-1' },
      data: { nextMeterValue: 1500 },
    })
    expect(mockDb.maintenancePlan.update).toHaveBeenCalledWith({
      where: { id: 'plan-2' },
      data: { nextMeterValue: 1250 },
    })
  })

  it('Test 3: retourne null sans throw si aucun compteur trouvé', async () => {
    mockDb.assetMeter.findFirst.mockResolvedValue(null)

    const result = await updateMeterAndPlans('asset-no-meter', 'org-1', 100)

    expect(result).toBeNull()
    expect(mockDb.assetMeter.update).not.toHaveBeenCalled()
    expect(mockDb.maintenancePlan.findMany).not.toHaveBeenCalled()
  })

  it('Test 4: ignore les plans meter_based avec meterThreshold null', async () => {
    const fakeMeter = { id: 'meter-1', assetId: 'asset-1', name: 'Cycles', unit: 'cycles', value: 0 }
    const fakePlans = [
      { id: 'plan-1', meterThreshold: null },
      { id: 'plan-2', meterThreshold: 300 },
    ]
    mockDb.assetMeter.findFirst.mockResolvedValue(fakeMeter)
    mockDb.assetMeter.update.mockResolvedValue({ ...fakeMeter, value: 50 })
    mockDb.maintenancePlan.findMany.mockResolvedValue(fakePlans)
    mockDb.maintenancePlan.update.mockResolvedValue({})

    await updateMeterAndPlans('asset-1', 'org-1', 50)

    // Only plan-2 should be updated (plan-1 has null meterThreshold)
    expect(mockDb.maintenancePlan.update).toHaveBeenCalledTimes(1)
    expect(mockDb.maintenancePlan.update).toHaveBeenCalledWith({
      where: { id: 'plan-2' },
      data: { nextMeterValue: 350 },
    })
  })
})

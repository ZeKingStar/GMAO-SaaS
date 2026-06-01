import type { Metadata } from 'next'
import { requirePlan } from '@/lib/auth'
import { UpgradeGate } from '@/components/upgrade-gate/upgrade-gate'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { OverviewTab } from '@/components/rapports/overview-tab'
import { TopFaultsTab } from '@/components/rapports/top-faults-tab'
import { MttrTab } from '@/components/rapports/mttr-tab'
import { CostTab } from '@/components/rapports/cost-tab'
import { PeriodSelector } from '@/components/rapports/period-selector'
import { DEFAULT_PERIOD, isPeriod, type Period } from '@/lib/report-utils'
import { PlannedVsRealTab, isSubTab, type SubTab } from '@/components/rapports/planned-vs-real-tab'

export const metadata: Metadata = { title: 'Rapports' }

const VALID_TABS = ['overview', 'top-faults', 'mttr', 'cost', 'planned-vs-real'] as const
type TabValue = typeof VALID_TABS[number]

function isTab(value: string | undefined): value is TabValue {
  return typeof value === 'string' && (VALID_TABS as readonly string[]).includes(value)
}

type SearchParams = Promise<{ tab?: string; period?: string; subtab?: string }>

export default async function RapportsPage({ searchParams }: { searchParams: SearchParams }) {
  const { membership, hasAccess } = await requirePlan(['growth', 'enterprise'])
  const orgId = membership.organization.id

const priorityColor: Record<string, string> = {
  low: 'bg-blue-400',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
}

const statusOrder = ['open', 'in_progress', 'on_hold', 'resolved', 'closed']
const priorityOrder = ['urgent', 'high', 'medium', 'low']

export default async function RapportsPage() {
  const { orgId } = await getAuth()
  if (!orgId) redirect('/sign-in')

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    workOrdersByStatus,
    workOrdersByPriority,
    workOrdersThisMonth,
    completedThisMonth,
    totalTimeLogs,
    maintenancePlansTotal,
    activePlansCount,
    spareParts,
    topAssetGroups,
  ] = await Promise.all([
    db.workOrder.groupBy({
      by: ['status'],
      where: { organizationId: orgId },
      _count: { _all: true },
    }),
    db.workOrder.groupBy({
      by: ['priority'],
      where: { organizationId: orgId },
      _count: { _all: true },
    }),
    db.workOrder.count({
      where: { organizationId: orgId, createdAt: { gte: startOfMonth } },
    }),
    db.workOrder.count({
      where: {
        organizationId: orgId,
        status: { in: ['resolved', 'closed'] },
        updatedAt: { gte: startOfMonth },
      },
    }),
    db.workOrderTimeLog.aggregate({
      where: { workOrder: { organizationId: orgId } },
      _sum: { minutes: true },
    }),
    db.maintenancePlan.count({ where: { organizationId: orgId } }),
    db.maintenancePlan.count({ where: { organizationId: orgId, isActive: true } }),
    db.sparePart.findMany({
      where: { organizationId: orgId, quantityMin: { not: null } },
      select: {
        id: true,
        name: true,
        partNumber: true,
        quantityOnHand: true,
        quantityMin: true,
        unit: true,
      },
    }),
    db.workOrder.groupBy({
      by: ['assetId'],
      where: { organizationId: orgId, assetId: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { assetId: 'desc' } },
      take: 5,
    }),
  ])

  const assetIds = topAssetGroups.map(g => g.assetId).filter(Boolean) as string[]
  const assetNames = assetIds.length
    ? await db.asset.findMany({
        where: { id: { in: assetIds } },
        select: { id: true, name: true },
      })
    : []

  const topAssets = topAssetGroups.map(g => ({
    name: assetNames.find(a => a.id === g.assetId)?.name ?? 'Inconnu',
    count: g._count._all,
  }))

  const activeWorkOrders = workOrdersByStatus
    .filter(s => ['open', 'in_progress', 'on_hold'].includes(s.status))
    .reduce((sum, s) => sum + s._count._all, 0)

  const totalWorkOrders = workOrdersByStatus.reduce((sum, s) => sum + s._count._all, 0)
  const resolutionRate =
    workOrdersThisMonth > 0 ? Math.round((completedThisMonth / workOrdersThisMonth) * 100) : 0
  const totalHours = Math.round((totalTimeLogs._sum.minutes ?? 0) / 60)
  const lowStockParts = spareParts.filter(p => p.quantityOnHand < (p.quantityMin ?? Infinity))

  const maxStatusCount = Math.max(...workOrdersByStatus.map(s => s._count._all), 1)
  const maxPriorityCount = Math.max(...workOrdersByPriority.map(p => p._count._all), 1)

  const sortedStatuses = [...workOrdersByStatus].sort(
    (a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status),
  )
  const sortedPriorities = [...workOrdersByPriority].sort(
    (a, b) => priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority),
  )

  return (
    <UpgradeGate hasAccess={hasAccess} requiredPlan="growth">
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Rapports & Indicateurs</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Analytique de fiabilité — pannes, MTTR, coûts, planifié vs réel
            </p>
          </div>
          {tab !== 'overview' && <PeriodSelector value={period} />}
        </div>

        <Tabs defaultValue={tab}>
          <TabsList>
            <TabsTrigger value="overview" render={<a href="?tab=overview">Vue générale</a>} />
            <TabsTrigger value="top-faults" render={<a href={`?tab=top-faults&period=${period}`}>Top pannes</a>} />
            <TabsTrigger value="mttr" render={<a href={`?tab=mttr&period=${period}`}>MTTR</a>} />
            <TabsTrigger value="cost" render={<a href={`?tab=cost&period=${period}`}>Coût actifs</a>} />
            <TabsTrigger value="planned-vs-real" render={<a href={`?tab=planned-vs-real&period=${period}`}>Planifié vs Réel</a>} />
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <OverviewTab orgId={orgId} />
          </TabsContent>

          <TabsContent value="top-faults" className="mt-4">
            <TopFaultsTab orgId={orgId} period={period} />
          </TabsContent>

          <TabsContent value="mttr" className="mt-4">
            <MttrTab orgId={orgId} period={period} />
          </TabsContent>

          <TabsContent value="cost" className="mt-4">
            <CostTab orgId={orgId} period={period} />
          </TabsContent>

          <TabsContent value="planned-vs-real" className="mt-4">
            <PlannedVsRealTab orgId={orgId} period={period} subtab={subtab} />
          </TabsContent>
        </Tabs>
      </div>
    </UpgradeGate>
  )
}

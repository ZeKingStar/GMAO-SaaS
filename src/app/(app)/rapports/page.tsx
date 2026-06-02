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

  const { tab: rawTab, period: rawPeriod, subtab: rawSubtab } = await searchParams
  const tab: TabValue = isTab(rawTab) ? rawTab : 'overview'
  const period: Period = isPeriod(rawPeriod) ? rawPeriod : DEFAULT_PERIOD
  const subtab: SubTab = isSubTab(rawSubtab) ? rawSubtab : 'by-wo'

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

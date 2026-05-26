import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Target, TrendingUp, TrendingDown } from 'lucide-react'
import { getPeriodStart, PERIOD_LABELS, type Period } from '@/lib/report-utils'

export const VALID_SUBTABS = ['by-wo', 'by-tech', 'by-asset-type'] as const
export type SubTab = typeof VALID_SUBTABS[number]
export function isSubTab(value: string | undefined | null): value is SubTab {
  return typeof value === 'string' && (VALID_SUBTABS as readonly string[]).includes(value)
}

type Props = { orgId: string; period: Period; subtab: SubTab }

type ByWo = {
  id: string
  number: number
  title: string
  estimatedHours: number
  realHours: number
  deltaHours: number
  deltaPct: number
}
type ByGroup = {
  key: string
  label: string
  btCount: number
  totalEstimated: number
  totalReal: number
  deltaHours: number
  deltaPct: number
}

function formatDelta(delta: number): { text: string; positive: boolean } {
  const sign = delta >= 0 ? '+' : ''
  return { text: `${sign}${delta.toFixed(2)} h`, positive: delta >= 0 }
}

export async function PlannedVsRealTab({ orgId, period, subtab }: Props) {
  const periodStart = getPeriodStart(period)

  // Une seule requête sert les 3 vues — on dispose des assignees et asset.category
  const orders = await db.workOrder.findMany({
    where: {
      organizationId: orgId,
      estimatedHours: { not: null },
      completedAt: { gte: periodStart },
    },
    select: {
      id: true,
      number: true,
      title: true,
      estimatedHours: true,
      type: true,
      asset: {
        select: {
          category: { select: { id: true, name: true } },
        },
      },
      assignees: {
        select: {
          membership: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      },
      timeLogs: { select: { minutes: true } },
    },
  })

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Target className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium">Aucun bon de travail avec durée estimée sur la période</p>
          <p className="text-sm text-muted-foreground mt-1">
            Période : {PERIOD_LABELS[period]}. Renseignez le champ &quot;Heures estimées&quot; sur vos
            bons de travail pour activer cette comparaison.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Calculer pour chaque BT : realHours, delta
  const enriched = orders.map(o => {
    const realMinutes = o.timeLogs.reduce((s, tl) => s + (tl.minutes ?? 0), 0)
    const realHours = realMinutes / 60
    const estimated = o.estimatedHours ?? 0
    const deltaHours = realHours - estimated
    const deltaPct = estimated > 0 ? (deltaHours / estimated) * 100 : 0
    return { ...o, realHours, deltaHours, deltaPct }
  })

  // Vue Par BT
  const byWo: ByWo[] = enriched
    .map(o => ({
      id: o.id,
      number: o.number,
      title: o.title,
      estimatedHours: o.estimatedHours ?? 0,
      realHours: o.realHours,
      deltaHours: o.deltaHours,
      deltaPct: o.deltaPct,
    }))
    .sort((a, b) => Math.abs(b.deltaHours) - Math.abs(a.deltaHours))
    .slice(0, 30)

  // Vue Par technicien : agrégation par membershipId (un BT avec N assignees compte pour chaque)
  const byTechMap = new Map<string, ByGroup>()
  for (const o of enriched) {
    for (const a of o.assignees) {
      const m = a.membership
      if (!m) continue
      const label = [m.firstName, m.lastName].filter(Boolean).join(' ') || m.email || m.id
      let entry = byTechMap.get(m.id)
      if (!entry) {
        entry = { key: m.id, label, btCount: 0, totalEstimated: 0, totalReal: 0, deltaHours: 0, deltaPct: 0 }
        byTechMap.set(m.id, entry)
      }
      entry.btCount += 1
      entry.totalEstimated += o.estimatedHours ?? 0
      entry.totalReal += o.realHours
    }
  }
  const byTech: ByGroup[] = Array.from(byTechMap.values()).map(g => ({
    ...g,
    deltaHours: g.totalReal - g.totalEstimated,
    deltaPct: g.totalEstimated > 0 ? ((g.totalReal - g.totalEstimated) / g.totalEstimated) * 100 : 0,
  })).sort((a, b) => Math.abs(b.deltaHours) - Math.abs(a.deltaHours))

  // Vue Par type d'actif : groupé par asset.category.id (BTs sans catégorie → bucket "Sans catégorie")
  const byCatMap = new Map<string, ByGroup>()
  for (const o of enriched) {
    const cat = o.asset?.category
    const key = cat?.id ?? '__none__'
    const label = cat?.name ?? "Sans catégorie d'actif"
    let entry = byCatMap.get(key)
    if (!entry) {
      entry = { key, label, btCount: 0, totalEstimated: 0, totalReal: 0, deltaHours: 0, deltaPct: 0 }
      byCatMap.set(key, entry)
    }
    entry.btCount += 1
    entry.totalEstimated += o.estimatedHours ?? 0
    entry.totalReal += o.realHours
  }
  const byCat: ByGroup[] = Array.from(byCatMap.values()).map(g => ({
    ...g,
    deltaHours: g.totalReal - g.totalEstimated,
    deltaPct: g.totalEstimated > 0 ? ((g.totalReal - g.totalEstimated) / g.totalEstimated) * 100 : 0,
  })).sort((a, b) => Math.abs(b.deltaHours) - Math.abs(a.deltaHours))

  return (
    <div className="space-y-4">
      <Tabs defaultValue={subtab}>
        <TabsList variant="line">
          <TabsTrigger value="by-wo" render={<a href={`?tab=planned-vs-real&period=${period}&subtab=by-wo`}>Par BT</a>} />
          <TabsTrigger value="by-tech" render={<a href={`?tab=planned-vs-real&period=${period}&subtab=by-tech`}>Par technicien</a>} />
          <TabsTrigger value="by-asset-type" render={<a href={`?tab=planned-vs-real&period=${period}&subtab=by-asset-type`}>Par type d&apos;actif</a>} />
        </TabsList>

        <TabsContent value="by-wo" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Planifié vs Réel — Par BT ({PERIOD_LABELS[period]})</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Top 30 BTs triés par écart absolu</p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium text-muted-foreground">N°</th>
                      <th className="text-left py-2 font-medium text-muted-foreground">Titre</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Estimé</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Réel</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Écart</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byWo.map(r => {
                      const d = formatDelta(r.deltaHours)
                      return (
                        <tr key={r.id} className="border-b last:border-0">
                          <td className="py-2 font-medium tabular-nums">#{r.number}</td>
                          <td className="py-2 truncate max-w-[40%]">{r.title}</td>
                          <td className="py-2 text-right tabular-nums">{r.estimatedHours.toFixed(1)} h</td>
                          <td className="py-2 text-right tabular-nums">{r.realHours.toFixed(1)} h</td>
                          <td className={`py-2 text-right font-bold tabular-nums ${d.positive ? 'text-red-600' : 'text-green-600'}`}>{d.text}</td>
                          <td className={`py-2 text-right tabular-nums ${d.positive ? 'text-red-600' : 'text-green-600'}`}>{r.deltaPct >= 0 ? '+' : ''}{r.deltaPct.toFixed(0)}%</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="by-tech" className="mt-4">
          <GroupTable title={`Par technicien — ${PERIOD_LABELS[period]}`} rows={byTech} groupLabel="Technicien" />
        </TabsContent>

        <TabsContent value="by-asset-type" className="mt-4">
          <GroupTable title={`Par type d'actif — ${PERIOD_LABELS[period]}`} rows={byCat} groupLabel="Catégorie" />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function GroupTable({ title, rows, groupLabel }: { title: string; rows: ByGroup[]; groupLabel: string }) {
  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Aucune donnée à agréger pour cette vue.
        </CardContent>
      </Card>
    )
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium text-muted-foreground">{groupLabel}</th>
                <th className="text-right py-2 font-medium text-muted-foreground">BTs</th>
                <th className="text-right py-2 font-medium text-muted-foreground">Total estimé</th>
                <th className="text-right py-2 font-medium text-muted-foreground">Total réel</th>
                <th className="text-right py-2 font-medium text-muted-foreground">Écart</th>
                <th className="text-right py-2 font-medium text-muted-foreground">%</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const positive = r.deltaHours >= 0
                const Icon = positive ? TrendingUp : TrendingDown
                return (
                  <tr key={r.key} className="border-b last:border-0">
                    <td className="py-2 font-medium truncate max-w-[35%]">{r.label}</td>
                    <td className="py-2 text-right"><Badge variant="secondary">{r.btCount}</Badge></td>
                    <td className="py-2 text-right tabular-nums">{r.totalEstimated.toFixed(1)} h</td>
                    <td className="py-2 text-right tabular-nums">{r.totalReal.toFixed(1)} h</td>
                    <td className={`py-2 text-right font-bold tabular-nums ${positive ? 'text-red-600' : 'text-green-600'}`}>
                      <span className="inline-flex items-center gap-1">
                        <Icon className="h-3 w-3" />
                        {positive ? '+' : ''}{r.deltaHours.toFixed(2)} h
                      </span>
                    </td>
                    <td className={`py-2 text-right tabular-nums ${positive ? 'text-red-600' : 'text-green-600'}`}>{r.deltaPct >= 0 ? '+' : ''}{r.deltaPct.toFixed(0)}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

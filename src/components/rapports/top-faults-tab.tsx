import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle } from 'lucide-react'
import { getPeriodStart, PERIOD_LABELS, type Period } from '@/lib/report-utils'
import { FAULT_CATEGORY_LABELS, type FaultCategory } from '@/lib/closure-requirements'

type Props = { orgId: string; period: Period }

const CATEGORY_COLORS: Record<string, string> = {
  mecanique: 'bg-blue-500',
  electrique: 'bg-amber-500',
  hydraulique: 'bg-cyan-500',
  autre: 'bg-gray-400',
}

export async function TopFaultsTab({ orgId, period }: Props) {
  const periodStart = getPeriodStart(period)

  // D-03 : grouper par faultProblem + faultCategory
  const groups = await db.workOrder.groupBy({
    by: ['faultProblem', 'faultCategory'],
    where: {
      organizationId: orgId,
      faultProblem: { not: null },
      completedAt: { gte: periodStart },
    },
    _count: { faultProblem: true },
    orderBy: { _count: { faultProblem: 'desc' } },
    take: 10,
  })

  const total = groups.reduce((sum, g) => sum + (g._count.faultProblem ?? 0), 0)
  const maxCount = Math.max(...groups.map(g => g._count.faultProblem ?? 0), 1)

  if (groups.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium">Aucun code de panne saisi sur la période</p>
          <p className="text-sm text-muted-foreground mt-1">
            Période : {PERIOD_LABELS[period]}. Activez la saisie obligatoire dans
            Paramètres &gt; Organisation &gt; Exigences de clôture pour collecter ces données.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top {groups.length} pannes récurrentes — {PERIOD_LABELS[period]}</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">{total} bon(s) de travail clôturé(s) avec code de panne saisi</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {groups.map((g, i) => {
            const cat = g.faultCategory as FaultCategory | null
            const catLabel = cat ? FAULT_CATEGORY_LABELS[cat] ?? cat : 'Sans catégorie'
            const catColor = cat ? CATEGORY_COLORS[cat] ?? 'bg-gray-400' : 'bg-gray-400'
            return (
              <div key={`${g.faultProblem}-${g.faultCategory}-${i}`} className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Badge variant="outline" className={`${catColor} text-white border-0 shrink-0`}>{catLabel}</Badge>
                    <span className="truncate font-medium">{g.faultProblem}</span>
                  </div>
                  <span className="font-bold tabular-nums shrink-0">{g._count.faultProblem ?? 0}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${catColor}`}
                    style={{ width: `${Math.round(((g._count.faultProblem ?? 0) / maxCount) * 100)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}

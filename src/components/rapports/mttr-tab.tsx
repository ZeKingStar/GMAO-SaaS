import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock } from 'lucide-react'
import { getPeriodStart, PERIOD_LABELS, type Period } from '@/lib/report-utils'

type Props = { orgId: string; period: Period }

type AssetStat = {
  assetId: string
  assetName: string
  totalMinutes: number
  btCount: number
  mttrHours: number
}

export async function MttrTab({ orgId, period }: Props) {
  const periodStart = getPeriodStart(period)

  // [Pattern 4 RESEARCH.md] — pas de groupBy car on doit sommer timeLogs.minutes par assetId
  const orders = await db.workOrder.findMany({
    where: {
      organizationId: orgId,
      type: 'corrective',
      assetId: { not: null },
      completedAt: { gte: periodStart },
      timeLogs: { some: { minutes: { not: null } } },
    },
    select: {
      assetId: true,
      asset: { select: { id: true, name: true } },
      timeLogs: { select: { minutes: true } },
    },
  })

  // Agrégation JS par assetId
  const byAsset = new Map<string, AssetStat>()
  for (const o of orders) {
    if (!o.assetId || !o.asset) continue
    const minutes = o.timeLogs.reduce((sum, tl) => sum + (tl.minutes ?? 0), 0)
    if (minutes <= 0) continue
    const existing = byAsset.get(o.assetId)
    if (existing) {
      existing.totalMinutes += minutes
      existing.btCount += 1
    } else {
      byAsset.set(o.assetId, {
        assetId: o.assetId,
        assetName: o.asset.name,
        totalMinutes: minutes,
        btCount: 1,
        mttrHours: 0,
      })
    }
  }

  // MTTR = totalMinutes / btCount / 60 (heures)
  const stats: AssetStat[] = Array.from(byAsset.values())
    .map(s => ({ ...s, mttrHours: s.totalMinutes / s.btCount / 60 }))
    .sort((a, b) => b.mttrHours - a.mttrHours)
    .slice(0, 20)

  if (stats.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Clock className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium">Aucune session de temps enregistrée sur des BTs correctifs</p>
          <p className="text-sm text-muted-foreground mt-1">
            Période : {PERIOD_LABELS[period]}. Le MTTR nécessite que les techniciens démarrent
            la minuterie sur leurs bons de travail correctifs.
          </p>
        </CardContent>
      </Card>
    )
  }

  const maxMttr = Math.max(...stats.map(s => s.mttrHours), 0.01)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">MTTR par actif — {PERIOD_LABELS[period]}</CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Mean Time To Repair = temps total de réparation ÷ nombre de BTs correctifs clôturés
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium text-muted-foreground">Actif</th>
                <th className="text-right py-2 font-medium text-muted-foreground">BTs correctifs</th>
                <th className="text-right py-2 font-medium text-muted-foreground">Total heures</th>
                <th className="text-right py-2 font-medium text-muted-foreground">MTTR (h)</th>
                <th className="py-2 px-2 font-medium text-muted-foreground" style={{ minWidth: 120 }}>Visuel</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => (
                <tr key={s.assetId} className="border-b last:border-0">
                  <td className="py-2 font-medium truncate max-w-[40%]">{s.assetName}</td>
                  <td className="py-2 text-right"><Badge variant="secondary">{s.btCount}</Badge></td>
                  <td className="py-2 text-right tabular-nums">{(s.totalMinutes / 60).toFixed(1)} h</td>
                  <td className="py-2 text-right font-bold tabular-nums">{s.mttrHours.toFixed(2)} h</td>
                  <td className="py-2 px-2">
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all bg-amber-500"
                        style={{ width: `${Math.round((s.mttrHours / maxMttr) * 100)}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

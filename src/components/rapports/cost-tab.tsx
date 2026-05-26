import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DollarSign, AlertTriangle } from 'lucide-react'
import { getPeriodStart, PERIOD_LABELS, formatCurrency, type Period } from '@/lib/report-utils'

type Props = { orgId: string; period: Period }

type AssetCost = {
  assetId: string
  assetName: string
  laborCost: number
  partsCost: number
  total: number
  hasMissingRate: boolean
}

export async function CostTab({ orgId, period }: Props) {
  const periodStart = getPeriodStart(period)

  // [Pattern 5 RESEARCH.md] — deux requêtes parallèles + agrégation JS par assetId
  const [parts, timeLogs] = await Promise.all([
    db.workOrderPart.findMany({
      where: {
        workOrder: {
          organizationId: orgId,
          assetId: { not: null },
          completedAt: { gte: periodStart },
        },
      },
      select: {
        quantity: true,
        unitCost: true,
        workOrder: { select: { assetId: true, asset: { select: { name: true } } } },
      },
    }),
    db.workOrderTimeLog.findMany({
      where: {
        minutes: { not: null },
        workOrder: {
          organizationId: orgId,
          assetId: { not: null },
          completedAt: { gte: periodStart },
        },
      },
      select: {
        minutes: true,
        membership: { select: { hourlyRate: true } },
        workOrder: { select: { assetId: true, asset: { select: { name: true } } } },
      },
    }),
  ])

  const byAsset = new Map<string, AssetCost>()

  function getOrInit(assetId: string, assetName: string): AssetCost {
    let entry = byAsset.get(assetId)
    if (!entry) {
      entry = { assetId, assetName, laborCost: 0, partsCost: 0, total: 0, hasMissingRate: false }
      byAsset.set(assetId, entry)
    }
    return entry
  }

  // Coût pièces : unitCost × quantity (null unitCost → 0)
  for (const p of parts) {
    const aid = p.workOrder.assetId
    if (!aid || !p.workOrder.asset) continue
    const cost = (p.unitCost ?? 0) * p.quantity
    const entry = getOrInit(aid, p.workOrder.asset.name)
    entry.partsCost += cost
  }

  // Coût main-d'œuvre : (minutes / 60) × hourlyRate (Piège 4 — null → 0 + flag)
  for (const tl of timeLogs) {
    const aid = tl.workOrder.assetId
    if (!aid || !tl.workOrder.asset || tl.minutes == null) continue
    const rate = tl.membership?.hourlyRate
    const hours = tl.minutes / 60
    const cost = (rate ?? 0) * hours
    const entry = getOrInit(aid, tl.workOrder.asset.name)
    entry.laborCost += cost
    if (rate == null && tl.minutes > 0) {
      entry.hasMissingRate = true
    }
  }

  const stats: AssetCost[] = Array.from(byAsset.values())
    .map(s => ({ ...s, total: s.laborCost + s.partsCost }))
    .filter(s => s.total > 0 || s.hasMissingRate)
    .sort((a, b) => b.total - a.total)
    .slice(0, 20)

  if (stats.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <DollarSign className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium">Aucun bon de travail complété avec un actif associé</p>
          <p className="text-sm text-muted-foreground mt-1">
            Période : {PERIOD_LABELS[period]}. Le coût par actif nécessite des BTs clôturés
            avec pièces ou temps enregistrés.
          </p>
        </CardContent>
      </Card>
    )
  }

  const maxTotal = Math.max(...stats.map(s => s.total), 0.01)
  const hasAnyMissingRate = stats.some(s => s.hasMissingRate)

  return (
    <div className="space-y-4">
      {hasAnyMissingRate && (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm dark:bg-amber-950/30 dark:border-amber-900">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <p>
            Certains techniciens n'ont pas de taux horaire configuré — leur main-d'œuvre est
            comptée à 0 $. Configurez les taux dans Paramètres &gt; Équipe.
          </p>
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Coût de maintenance par actif — {PERIOD_LABELS[period]}</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Main-d'œuvre + pièces, top 20 actifs</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium text-muted-foreground">Actif</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Main-d'œuvre</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Pièces</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Total</th>
                  <th className="py-2 px-2 font-medium text-muted-foreground" style={{ minWidth: 120 }}>Visuel</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s) => (
                  <tr key={s.assetId} className="border-b last:border-0">
                    <td className="py-2 font-medium truncate max-w-[35%]">
                      <span>{s.assetName}</span>
                      {s.hasMissingRate && (
                        <Badge variant="outline" className="ml-2 border-amber-500 text-amber-700">
                          taux manquant
                        </Badge>
                      )}
                    </td>
                    <td className="py-2 text-right tabular-nums">{formatCurrency(s.laborCost)}</td>
                    <td className="py-2 text-right tabular-nums">{formatCurrency(s.partsCost)}</td>
                    <td className="py-2 text-right font-bold tabular-nums">{formatCurrency(s.total)}</td>
                    <td className="py-2 px-2">
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all bg-green-600"
                          style={{ width: `${Math.round((s.total / maxTotal) * 100)}%` }}
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
    </div>
  )
}

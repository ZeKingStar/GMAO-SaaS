import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ClipboardList, CheckCircle2, Clock, Package, Calendar, AlertTriangle } from 'lucide-react'

type Props = { orgId: string }

const statusLabel: Record<string, string> = {
  open: 'Ouvert',
  in_progress: 'En cours',
  on_hold: 'En attente',
  resolved: 'Résolu',
  closed: 'Fermé',
}

const statusColor: Record<string, string> = {
  open: 'bg-blue-500',
  in_progress: 'bg-amber-500',
  on_hold: 'bg-purple-400',
  resolved: 'bg-green-500',
  closed: 'bg-gray-400',
}

const priorityLabel: Record<string, string> = {
  low: 'Faible',
  medium: 'Moyen',
  high: 'Élevé',
  urgent: 'Urgent',
}

const priorityColor: Record<string, string> = {
  low: 'bg-blue-400',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
}

const statusOrder = ['open', 'in_progress', 'on_hold', 'resolved', 'closed']
const priorityOrder = ['urgent', 'high', 'medium', 'low']

export async function OverviewTab({ orgId }: Props) {
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
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">BT actifs</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeWorkOrders}</div>
            <p className="text-xs text-muted-foreground">{totalWorkOrders} au total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taux de résolution
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolutionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {completedThisMonth}/{workOrdersThisMonth} ce mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Heures loggées
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours}h</div>
            <p className="text-xs text-muted-foreground">sur tous les bons de travail</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Stock faible</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${lowStockParts.length > 0 ? 'text-orange-500' : ''}`}>
              {lowStockParts.length}
            </div>
            <p className="text-xs text-muted-foreground">pièce(s) sous le minimum</p>
          </CardContent>
        </Card>
      </div>

      {/* Distribution charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bons de travail par statut</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sortedStatuses.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun bon de travail</p>
            ) : (
              sortedStatuses.map(({ status, _count }) => (
                <div key={status} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{statusLabel[status] ?? status}</span>
                    <span className="font-medium">{_count._all}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${statusColor[status] ?? 'bg-primary'}`}
                      style={{ width: `${Math.round((_count._all / maxStatusCount) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bons de travail par priorité</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sortedPriorities.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun bon de travail</p>
            ) : (
              sortedPriorities.map(({ priority, _count }) => (
                <div key={priority} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{priorityLabel[priority] ?? priority}</span>
                    <span className="font-medium">{_count._all}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${priorityColor[priority] ?? 'bg-primary'}`}
                      style={{ width: `${Math.round((_count._all / maxPriorityCount) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Maintenance plans + Top assets */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Plans de maintenance</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="font-bold text-xl">{maintenancePlansTotal}</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm">Actifs</span>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-200">
                  {activePlansCount}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                  <span className="text-sm">Inactifs</span>
                </div>
                <Badge variant="outline" className="text-muted-foreground">
                  {maintenancePlansTotal - activePlansCount}
                </Badge>
              </div>
            </div>
            {maintenancePlansTotal > 0 && (
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-500"
                  style={{
                    width: `${Math.round((activePlansCount / maintenancePlansTotal) * 100)}%`,
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top actifs — bons de travail</CardTitle>
          </CardHeader>
          <CardContent>
            {topAssets.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun bon de travail lié à un actif</p>
            ) : (
              <div className="space-y-2">
                {topAssets.map(({ name, count }, i) => (
                  <div key={i} className="flex justify-between items-center py-1 border-b last:border-0">
                    <span className="text-sm truncate max-w-[70%]">{name}</span>
                    <Badge variant="secondary">{count} BT</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Low stock alert table */}
      {lowStockParts.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-3">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <CardTitle className="text-base">Pièces en stock faible</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium text-muted-foreground">Pièce</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Référence</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">En stock</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Minimum</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockParts.map(part => (
                    <tr key={part.id} className="border-b last:border-0">
                      <td className="py-2 font-medium">{part.name}</td>
                      <td className="py-2 text-muted-foreground">{part.partNumber ?? '—'}</td>
                      <td className="py-2 text-right font-medium text-orange-500">
                        {part.quantityOnHand}
                        {part.unit ? ` ${part.unit}` : ''}
                      </td>
                      <td className="py-2 text-right text-muted-foreground">
                        {part.quantityMin}
                        {part.unit ? ` ${part.unit}` : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

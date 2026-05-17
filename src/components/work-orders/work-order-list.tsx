'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Plus, ClipboardList, Calendar, User, Cpu, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { deleteWorkOrder } from '@/actions/work-orders'
import { WorkOrderFormDialog } from './work-order-form-dialog'
import { WorkOrderStatusBadge, WorkOrderPriorityBadge, workOrderTypeLabel } from './work-order-status-badge'
import type { WorkOrderStatus, WorkOrderPriority, WorkOrderType } from '@/generated/prisma/enums'

type Member = { id: string; firstName: string | null; lastName: string | null; email: string }
type Site = { id: string; name: string }
type Asset = { id: string; name: string }

type WorkOrder = {
  id: string
  number: number
  title: string
  type: WorkOrderType
  status: WorkOrderStatus
  priority: WorkOrderPriority
  dueDate: Date | null
  createdAt: Date
  asset: { id: string; name: string } | null
  site: { id: string; name: string } | null
  assignees: { membership: { firstName: string | null; lastName: string | null } }[]
  _count: { comments: number }
}

type Props = {
  workOrders: WorkOrder[]
  sites: Site[]
  assets: Asset[]
  members: Member[]
}

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'open', label: 'Ouverts' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'on_hold', label: 'En attente' },
  { value: 'resolved', label: 'Résolus' },
  { value: 'closed', label: 'Fermés' },
]

export function WorkOrderList({ workOrders, sites, assets, members }: Props) {
  const [, startTransition] = useTransition()
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  const filtered = workOrders.filter(wo => {
    if (statusFilter !== 'all' && wo.status !== statusFilter) return false
    if (typeFilter !== 'all' && wo.type !== typeFilter) return false
    return true
  })

  function handleDelete(wo: WorkOrder) {
    if (!confirm(`Supprimer le bon de travail #${wo.number} "${wo.title}" ?`)) return
    startTransition(async () => {
      try { await deleteWorkOrder(wo.id); toast.success('Bon de travail supprimé') }
      catch { toast.error('Erreur lors de la suppression') }
    })
  }

  if (workOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <ClipboardList className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-1">Aucun bon de travail</h3>
        <p className="text-muted-foreground text-sm mb-6 max-w-xs">
          Créez votre premier bon de travail pour commencer à gérer vos interventions.
        </p>
        <WorkOrderFormDialog sites={sites} assets={assets} members={members}>
          <Button><Plus className="h-4 w-4 mr-2" />Nouveau bon de travail</Button>
        </WorkOrderFormDialog>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                statusFilter === f.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {f.label}
              {f.value !== 'all' && (
                <span className="ml-1 opacity-70">
                  ({workOrders.filter(wo => wo.status === f.value).length})
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs focus:outline-none"
          >
            <option value="all">Tous les types</option>
            <option value="corrective">Correctif</option>
            <option value="preventive">Préventif</option>
            <option value="inspection">Inspection</option>
            <option value="service_request">Demande de service</option>
          </select>
          <WorkOrderFormDialog sites={sites} assets={assets} members={members}>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" />Nouveau</Button>
          </WorkOrderFormDialog>
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-12 text-sm">Aucun résultat pour ces filtres.</p>
        ) : (
          filtered.map(wo => (
            <Link
              key={wo.id}
              href={`/bons-de-travail/${wo.id}`}
              className="group flex items-center gap-4 px-4 py-3 rounded-xl border bg-card hover:border-primary/30 hover:shadow-sm transition-all"
            >
              <div className="text-xs font-mono text-muted-foreground w-10 shrink-0">
                #{wo.number}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm truncate">{wo.title}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{workOrderTypeLabel(wo.type)}</span>
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {wo.asset && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Cpu className="h-3 w-3" />{wo.asset.name}
                    </span>
                  )}
                  {wo.site && (
                    <span className="text-xs text-muted-foreground">{wo.site.name}</span>
                  )}
                  {wo.dueDate && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(wo.dueDate).toLocaleDateString('fr-CA')}
                    </span>
                  )}
                  {wo.assignees.length > 0 && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      {wo.assignees.map(a => `${a.membership.firstName ?? ''} ${a.membership.lastName ?? ''}`.trim()).join(', ')}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <WorkOrderPriorityBadge priority={wo.priority} />
                <WorkOrderStatusBadge status={wo.status} />
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))
        )}
      </div>

      <p className="text-xs text-muted-foreground text-right">
        {filtered.length} résultat{filtered.length !== 1 ? 's' : ''} sur {workOrders.length}
      </p>
    </div>
  )
}

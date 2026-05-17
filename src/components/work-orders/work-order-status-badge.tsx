import { Badge } from '@/components/ui/badge'
import type { WorkOrderStatus, WorkOrderPriority } from '@/generated/prisma/enums'

const STATUS_CONFIG: Record<WorkOrderStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' }> = {
  open: { label: 'Ouvert', variant: 'secondary' },
  in_progress: { label: 'En cours', variant: 'default' },
  on_hold: { label: 'En attente', variant: 'warning' },
  resolved: { label: 'Résolu', variant: 'success' },
  closed: { label: 'Fermé', variant: 'outline' },
}

const PRIORITY_CONFIG: Record<WorkOrderPriority, { label: string; className: string }> = {
  low: { label: 'Basse', className: 'text-muted-foreground border-muted-foreground/30' },
  medium: { label: 'Moyenne', className: 'text-blue-600 border-blue-300 bg-blue-50' },
  high: { label: 'Haute', className: 'text-orange-600 border-orange-300 bg-orange-50' },
  urgent: { label: 'Urgente', className: 'text-red-600 border-red-300 bg-red-50' },
}

const TYPE_LABELS: Record<string, string> = {
  corrective: 'Correctif',
  preventive: 'Préventif',
  inspection: 'Inspection',
  service_request: 'Demande de service',
}

export function WorkOrderStatusBadge({ status }: { status: WorkOrderStatus }) {
  const config = STATUS_CONFIG[status]
  return <Badge variant={config.variant as 'default'}>{config.label}</Badge>
}

export function WorkOrderPriorityBadge({ priority }: { priority: WorkOrderPriority }) {
  const config = PRIORITY_CONFIG[priority]
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}

export function workOrderTypeLabel(type: string) {
  return TYPE_LABELS[type] ?? type
}

export function statusLabel(status: WorkOrderStatus) {
  return STATUS_CONFIG[status]?.label ?? status
}

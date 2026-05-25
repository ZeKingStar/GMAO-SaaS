'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowLeft, Clock, User, Cpu, MapPin, Pencil, Trash2, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  updateWorkOrderStatus,
  addComment,
  deleteComment,
  assignMember,
  unassignMember,
  logTime,
} from '@/actions/work-orders'
import { WorkOrderFormDialog } from './work-order-form-dialog'
import { WorkOrderStatusBadge, WorkOrderPriorityBadge, workOrderTypeLabel } from './work-order-status-badge'
import type { WorkOrderStatus, WorkOrderType, WorkOrderPriority, MemberRole } from '@/generated/prisma/enums'
import type { ClosureRequirements } from '@/lib/closure-requirements'

type Member = { id: string; firstName: string | null; lastName: string | null; email: string }
type Site = { id: string; name: string }
type Asset = { id: string; name: string }

type SparePartLite = { id: string; name: string; partNumber: string | null; quantityOnHand: number; unitCost: number | null }

type WorkOrder = {
  id: string
  number: number
  title: string
  description: string | null
  type: WorkOrderType
  status: WorkOrderStatus
  priority: WorkOrderPriority
  dueDate: Date | null
  startedAt: Date | null
  completedAt: Date | null
  estimatedHours: number | null
  closureNotes: string | null
  createdAt: Date
  siteId: string | null
  assetId: string | null
  faultCategory: string | null
  faultDescription: string | null
  asset: Asset | null
  site: Site | null
  assignees: { membershipId: string; membership: Member & { hourlyRate: number | null } }[]
  comments: {
    id: string
    content: string
    createdAt: Date
    membership: { id: string; firstName: string | null; lastName: string | null }
  }[]
  timeLogs: {
    id: string
    startedAt: Date
    endedAt: Date | null
    minutes: number | null
    notes: string | null
    membership: { id: string; firstName: string | null; lastName: string | null }
  }[]
  parts: {
    id: string
    sparePartId: string | null
    name: string
    quantity: number
    unitCost: number | null
    sparePart: SparePartLite | null
  }[]
}

type Props = {
  workOrder: WorkOrder
  allMembers: Member[]
  allSites: Site[]
  allAssets: Asset[]
  spareParts: SparePartLite[]
  currentMembershipId: string
  currentRole: MemberRole
  closureRequirements: ClosureRequirements
}

const STATUS_TRANSITIONS: Record<WorkOrderStatus, { value: WorkOrderStatus; label: string }[]> = {
  open: [{ value: 'in_progress', label: 'Démarrer' }, { value: 'on_hold', label: 'Mettre en attente' }],
  in_progress: [{ value: 'resolved', label: 'Marquer résolu' }, { value: 'on_hold', label: 'Mettre en attente' }],
  on_hold: [{ value: 'in_progress', label: 'Reprendre' }, { value: 'closed', label: 'Fermer' }],
  resolved: [{ value: 'closed', label: 'Fermer' }, { value: 'in_progress', label: 'Rouvrir' }],
  closed: [{ value: 'open', label: 'Rouvrir' }],
}

const SELECT_CLASS = 'h-9 rounded-lg border border-input bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50'

export function WorkOrderDetail({ workOrder, allMembers, allSites, allAssets, spareParts, currentMembershipId, currentRole, closureRequirements }: Props) {
  const [, startTransition] = useTransition()
  const [comment, setComment] = useState('')
  const [showTimeLog, setShowTimeLog] = useState(false)
  const [timeLog, setTimeLog] = useState({ startedAt: '', endedAt: '', notes: '' })

  const assignedIds = workOrder.assignees.map(a => a.membershipId)
  const unassignedMembers = allMembers.filter(m => !assignedIds.includes(m.id))
  const totalMinutes = workOrder.timeLogs.reduce((sum, l) => sum + (l.minutes ?? 0), 0)

  function handleStatusChange(status: WorkOrderStatus) {
    startTransition(async () => {
      try { await updateWorkOrderStatus(workOrder.id, status); toast.success('Statut mis à jour') }
      catch { toast.error('Erreur') }
    })
  }

  function handleAddComment(e: React.FormEvent) {
    e.preventDefault()
    if (!comment.trim()) return
    startTransition(async () => {
      try {
        await addComment(workOrder.id, comment.trim())
        setComment('')
        toast.success('Commentaire ajouté')
      } catch { toast.error('Erreur') }
    })
  }

  function handleDeleteComment(commentId: string) {
    if (!confirm('Supprimer ce commentaire ?')) return
    startTransition(async () => {
      try { await deleteComment(workOrder.id, commentId); toast.success('Commentaire supprimé') }
      catch { toast.error('Erreur') }
    })
  }

  function handleAssign(membershipId: string) {
    startTransition(async () => {
      try { await assignMember(workOrder.id, membershipId); toast.success('Membre assigné') }
      catch { toast.error('Erreur') }
    })
  }

  function handleUnassign(membershipId: string) {
    startTransition(async () => {
      try { await unassignMember(workOrder.id, membershipId); toast.success('Membre retiré') }
      catch { toast.error('Erreur') }
    })
  }

  function handleLogTime(e: React.FormEvent) {
    e.preventDefault()
    if (!timeLog.startedAt || !timeLog.endedAt) { toast.error('Heures requises'); return }
    startTransition(async () => {
      try {
        await logTime(workOrder.id, timeLog)
        setTimeLog({ startedAt: '', endedAt: '', notes: '' })
        setShowTimeLog(false)
        toast.success('Temps enregistré')
      } catch { toast.error('Erreur') }
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/bons-de-travail">
          <Button variant="ghost" size="icon-sm"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <span className="font-mono">#{workOrder.number}</span>
            <span>·</span>
            <span>{workOrderTypeLabel(workOrder.type)}</span>
          </div>
          <h1 className="text-xl font-bold">{workOrder.title}</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <WorkOrderStatusBadge status={workOrder.status} />
            <WorkOrderPriorityBadge priority={workOrder.priority} />
          </div>
        </div>
        <WorkOrderFormDialog workOrder={workOrder} sites={allSites} assets={allAssets} members={allMembers}>
          <Button variant="outline" size="sm"><Pencil className="h-4 w-4 mr-2" />Modifier</Button>
        </WorkOrderFormDialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {workOrder.description && (
            <div className="rounded-xl border bg-card p-4">
              <h2 className="text-sm font-semibold mb-2">Description</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{workOrder.description}</p>
            </div>
          )}

          {/* Status actions */}
          {STATUS_TRANSITIONS[workOrder.status]?.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {STATUS_TRANSITIONS[workOrder.status].map(t => (
                <Button key={t.value} variant="outline" size="sm" onClick={() => handleStatusChange(t.value)}>
                  {t.label}
                </Button>
              ))}
            </div>
          )}

          {/* Comments */}
          <div className="rounded-xl border bg-card p-4 space-y-4">
            <h2 className="text-sm font-semibold">Commentaires ({workOrder.comments.length})</h2>

            {workOrder.comments.length > 0 && (
              <div className="space-y-3">
                {workOrder.comments.map(c => (
                  <div key={c.id} className="flex gap-3">
                    <div className="flex-1 rounded-lg bg-muted px-3 py-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">
                          {c.membership.firstName} {c.membership.lastName}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">
                            {new Date(c.createdAt).toLocaleDateString('fr-CA')}
                          </span>
                          {c.membership.id === currentMembershipId && (
                            <button onClick={() => handleDeleteComment(c.id)} className="text-muted-foreground hover:text-destructive ml-1">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleAddComment} className="flex gap-2">
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Ajouter un commentaire..."
                rows={2}
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring/50"
              />
              <Button type="submit" size="sm" disabled={!comment.trim()}>Envoyer</Button>
            </form>
          </div>

          {/* Time logs */}
          <div className="rounded-xl border bg-card p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">
                Temps ({totalMinutes >= 60 ? `${Math.floor(totalMinutes / 60)}h${totalMinutes % 60 > 0 ? (totalMinutes % 60) + 'm' : ''}` : `${totalMinutes}m`})
              </h2>
              <Button variant="outline" size="sm" onClick={() => setShowTimeLog(v => !v)}>
                <Clock className="h-4 w-4 mr-1.5" />Enregistrer du temps
              </Button>
            </div>

            {showTimeLog && (
              <form onSubmit={handleLogTime} className="border rounded-lg p-3 space-y-3 bg-muted/30">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Début</label>
                    <input
                      type="datetime-local"
                      value={timeLog.startedAt}
                      onChange={e => setTimeLog(f => ({ ...f, startedAt: e.target.value }))}
                      className="w-full h-9 rounded-lg border border-input bg-background px-2.5 text-sm focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Fin</label>
                    <input
                      type="datetime-local"
                      value={timeLog.endedAt}
                      onChange={e => setTimeLog(f => ({ ...f, endedAt: e.target.value }))}
                      className="w-full h-9 rounded-lg border border-input bg-background px-2.5 text-sm focus:outline-none"
                    />
                  </div>
                </div>
                <input
                  placeholder="Notes (optionnel)"
                  value={timeLog.notes}
                  onChange={e => setTimeLog(f => ({ ...f, notes: e.target.value }))}
                  className="w-full h-9 rounded-lg border border-input bg-background px-2.5 text-sm focus:outline-none"
                />
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowTimeLog(false)}>Annuler</Button>
                  <Button type="submit" size="sm">Enregistrer</Button>
                </div>
              </form>
            )}

            {workOrder.timeLogs.length > 0 && (
              <div className="space-y-2">
                {workOrder.timeLogs.map(log => (
                  <div key={log.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                    <div>
                      <span className="font-medium">{log.membership.firstName} {log.membership.lastName}</span>
                      {log.notes && <span className="text-muted-foreground ml-2">— {log.notes}</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(log.startedAt).toLocaleDateString('fr-CA')} · {log.minutes}m
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Details */}
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <h2 className="text-sm font-semibold">Détails</h2>

            {workOrder.asset && (
              <div className="flex items-center gap-2 text-sm">
                <Cpu className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{workOrder.asset.name}</span>
              </div>
            )}
            {workOrder.site && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{workOrder.site.name}</span>
              </div>
            )}
            {workOrder.dueDate && (
              <div className="text-sm">
                <span className="text-muted-foreground text-xs block mb-0.5">Échéance</span>
                <span className={new Date(workOrder.dueDate) < new Date() && workOrder.status !== 'closed' ? 'text-destructive font-medium' : ''}>
                  {new Date(workOrder.dueDate).toLocaleDateString('fr-CA', { dateStyle: 'long' })}
                </span>
              </div>
            )}
            {workOrder.estimatedHours && (
              <div className="text-sm">
                <span className="text-muted-foreground text-xs block mb-0.5">Temps estimé</span>
                <span>{workOrder.estimatedHours}h</span>
              </div>
            )}
            <div className="text-sm">
              <span className="text-muted-foreground text-xs block mb-0.5">Créé le</span>
              <span>{new Date(workOrder.createdAt).toLocaleDateString('fr-CA', { dateStyle: 'long' })}</span>
            </div>
          </div>

          {/* Assignees */}
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <h2 className="text-sm font-semibold">Assignés ({workOrder.assignees.length})</h2>

            {workOrder.assignees.map(a => (
              <div key={a.membershipId} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                    {(a.membership.firstName?.[0] ?? '?').toUpperCase()}
                  </div>
                  <span className="text-sm">{a.membership.firstName} {a.membership.lastName}</span>
                </div>
                <button onClick={() => handleUnassign(a.membershipId)} className="text-muted-foreground hover:text-destructive">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            {unassignedMembers.length > 0 && (
              <select
                defaultValue=""
                onChange={e => { if (e.target.value) { handleAssign(e.target.value); e.target.value = '' } }}
                className={`w-full ${SELECT_CLASS} text-xs`}
              >
                <option value="">+ Assigner un membre</option>
                {unassignedMembers.map(m => (
                  <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
                ))}
              </select>
            )}
          </div>

          {/* Closure notes */}
          {workOrder.closureNotes && (
            <div className="rounded-xl border bg-card p-4">
              <h2 className="text-sm font-semibold mb-2">Notes de fermeture</h2>
              <p className="text-sm text-muted-foreground">{workOrder.closureNotes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

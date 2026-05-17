'use client'

import React, { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { createWorkOrder, updateWorkOrder } from '@/actions/work-orders'
import type { WorkOrderType, WorkOrderPriority } from '@/generated/prisma/enums'

type Site = { id: string; name: string }
type Asset = { id: string; name: string }
type Member = { id: string; firstName: string | null; lastName: string | null; email: string }

type WorkOrder = {
  id: string
  title: string
  description: string | null
  type: WorkOrderType
  priority: WorkOrderPriority
  siteId: string | null
  assetId: string | null
  dueDate: Date | null
  estimatedHours: number | null
}

type Props = {
  workOrder?: WorkOrder
  sites: Site[]
  assets: Asset[]
  members: Member[]
  children: React.ReactElement
}

const SELECT_CLASS = 'w-full h-9 rounded-lg border border-input bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50'

export function WorkOrderFormDialog({ workOrder, sites, assets, members, children }: Props) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState({
    title: workOrder?.title ?? '',
    description: workOrder?.description ?? '',
    type: (workOrder?.type ?? 'corrective') as WorkOrderType,
    priority: (workOrder?.priority ?? 'medium') as WorkOrderPriority,
    siteId: workOrder?.siteId ?? '',
    assetId: workOrder?.assetId ?? '',
    dueDate: workOrder?.dueDate ? new Date(workOrder.dueDate).toISOString().slice(0, 10) : '',
    estimatedHours: workOrder?.estimatedHours?.toString() ?? '',
    assigneeIds: [] as string[],
  })

  function handleOpen(isOpen: boolean) {
    if (isOpen) {
      setForm({
        title: workOrder?.title ?? '',
        description: workOrder?.description ?? '',
        type: (workOrder?.type ?? 'corrective') as WorkOrderType,
        priority: (workOrder?.priority ?? 'medium') as WorkOrderPriority,
        siteId: workOrder?.siteId ?? '',
        assetId: workOrder?.assetId ?? '',
        dueDate: workOrder?.dueDate ? new Date(workOrder.dueDate).toISOString().slice(0, 10) : '',
        estimatedHours: workOrder?.estimatedHours?.toString() ?? '',
        assigneeIds: [],
      })
    }
    setOpen(isOpen)
  }

  const trigger = React.cloneElement(
    children as React.ReactElement<React.HTMLAttributes<HTMLElement>>,
    { onClick: () => handleOpen(true) }
  )

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function toggleAssignee(id: string) {
    setForm(f => ({
      ...f,
      assigneeIds: f.assigneeIds.includes(id)
        ? f.assigneeIds.filter(a => a !== id)
        : [...f.assigneeIds, id],
    }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Le titre est requis'); return }

    startTransition(async () => {
      try {
        const data = {
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          type: form.type,
          priority: form.priority,
          siteId: form.siteId || undefined,
          assetId: form.assetId || undefined,
          dueDate: form.dueDate || undefined,
          estimatedHours: form.estimatedHours ? parseFloat(form.estimatedHours) : undefined,
          assigneeIds: form.assigneeIds.length ? form.assigneeIds : undefined,
        }
        if (workOrder) {
          await updateWorkOrder(workOrder.id, data)
          toast.success('Bon de travail mis à jour')
        } else {
          await createWorkOrder(data)
          toast.success('Bon de travail créé')
        }
        setOpen(false)
      } catch {
        toast.error('Une erreur est survenue')
      }
    })
  }

  return (
    <>
      {trigger}
      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{workOrder ? 'Modifier le bon de travail' : 'Nouveau bon de travail'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wo-title">Titre *</Label>
              <Input
                id="wo-title"
                value={form.title}
                onChange={e => set('title', e.target.value)}
                placeholder="Ex : Remplacement filtre compresseur"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wo-desc">Description</Label>
              <textarea
                id="wo-desc"
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Détails du travail à effectuer..."
                rows={3}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="wo-type">Type</Label>
                <select id="wo-type" value={form.type} onChange={e => set('type', e.target.value)} className={SELECT_CLASS}>
                  <option value="corrective">Correctif</option>
                  <option value="preventive">Préventif</option>
                  <option value="inspection">Inspection</option>
                  <option value="service_request">Demande de service</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="wo-priority">Priorité</Label>
                <select id="wo-priority" value={form.priority} onChange={e => set('priority', e.target.value)} className={SELECT_CLASS}>
                  <option value="low">Basse</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Haute</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="wo-site">Site</Label>
                <select id="wo-site" value={form.siteId} onChange={e => set('siteId', e.target.value)} className={SELECT_CLASS}>
                  <option value="">— Aucun —</option>
                  {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="wo-asset">Actif</Label>
                <select id="wo-asset" value={form.assetId} onChange={e => set('assetId', e.target.value)} className={SELECT_CLASS}>
                  <option value="">— Aucun —</option>
                  {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="wo-due">Date d&apos;échéance</Label>
                <Input
                  id="wo-due"
                  type="date"
                  value={form.dueDate}
                  onChange={e => set('dueDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wo-hours">Heures estimées</Label>
                <Input
                  id="wo-hours"
                  type="number"
                  min="0"
                  step="0.5"
                  value={form.estimatedHours}
                  onChange={e => set('estimatedHours', e.target.value)}
                  placeholder="Ex : 2.5"
                />
              </div>
            </div>

            {!workOrder && members.length > 0 && (
              <div className="space-y-2">
                <Label>Assigner à</Label>
                <div className="space-y-1.5 max-h-32 overflow-y-auto border rounded-lg p-2">
                  {members.map(m => (
                    <label key={m.id} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={form.assigneeIds.includes(m.id)}
                        onChange={() => toggleAssignee(m.id)}
                        className="rounded"
                      />
                      <span>{m.firstName} {m.lastName}</span>
                      <span className="text-muted-foreground text-xs">{m.email}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={pending}>
                {pending ? 'Enregistrement...' : workOrder ? 'Mettre à jour' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

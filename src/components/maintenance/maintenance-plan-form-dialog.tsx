'use client'

import React, { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { createMaintenancePlan, updateMaintenancePlan } from '@/actions/maintenance'
import type { MaintenanceTriggerType, MaintenanceFrequency, WorkOrderPriority } from '@/generated/prisma/enums'
import { Plus, X } from 'lucide-react'
import { PlanPartsSection } from './plan-parts-section'

type Asset = { id: string; name: string }
type Category = { id: string; name: string }
// SparePart full type — used for the picker prop (description, quantityOnHand, supplier needed)
type SparePart = { id: string; name: string; partNumber: string | null; description: string | null; quantityOnHand: number; supplier: string | null }
// SparePartNarrow — used in PlanPart for display only (only id, name, partNumber fetched from DB)
type SparePartNarrow = { id: string; name: string; partNumber: string | null }

type PlanPart = {
  id: string
  sparePartId: string | null
  name: string
  quantity: number
  sparePart?: SparePartNarrow | null
}

type MaintenancePlan = {
  id: string
  name: string
  description: string | null
  triggerType: MaintenanceTriggerType
  frequency: MaintenanceFrequency | null
  customDays: number | null
  meterThreshold: number | null
  estimatedHours: number | null
  priority: WorkOrderPriority
  assetId: string | null
  categoryId: string | null
  nextDueAt: Date | null
  tasks: { id: string; description: string; order: number }[]
  planParts?: PlanPart[]
}

type Props = {
  plan?: MaintenancePlan
  assets: Asset[]
  categories: Category[]
  spareParts?: SparePart[]
  children: React.ReactElement
}

const SELECT_CLASS = 'w-full h-9 rounded-lg border border-input bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50'

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Quotidien',
  weekly: 'Hebdomadaire',
  biweekly: 'Bimensuel',
  monthly: 'Mensuel',
  quarterly: 'Trimestriel',
  semi_annual: 'Semestriel',
  annual: 'Annuel',
  custom: 'Personnalisé',
}

export function MaintenancePlanFormDialog({ plan, assets, categories, spareParts = [], children }: Props) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [taskInput, setTaskInput] = useState('')
  const [form, setForm] = useState({
    name: plan?.name ?? '',
    description: plan?.description ?? '',
    triggerType: (plan?.triggerType ?? 'time_based') as MaintenanceTriggerType,
    frequency: (plan?.frequency ?? 'monthly') as MaintenanceFrequency,
    customDays: plan?.customDays?.toString() ?? '',
    meterThreshold: plan?.meterThreshold?.toString() ?? '',
    estimatedHours: plan?.estimatedHours?.toString() ?? '',
    priority: (plan?.priority ?? 'medium') as WorkOrderPriority,
    assetId: plan?.assetId ?? '',
    categoryId: plan?.categoryId ?? '',
    nextDueAt: plan?.nextDueAt ? new Date(plan.nextDueAt).toISOString().slice(0, 10) : '',
    tasks: plan?.tasks?.map(t => t.description) ?? [],
  })

  function handleOpen(isOpen: boolean) {
    if (isOpen && plan) {
      // Forcer re-sync avec les props courantes à chaque ouverture
      setForm({
        name: plan.name,
        description: plan.description ?? '',
        triggerType: plan.triggerType,
        frequency: (plan.frequency ?? 'monthly') as MaintenanceFrequency,
        customDays: plan.customDays?.toString() ?? '',
        meterThreshold: plan.meterThreshold?.toString() ?? '',
        estimatedHours: plan.estimatedHours?.toString() ?? '',
        priority: plan.priority,
        assetId: plan.assetId ?? '',
        categoryId: plan.categoryId ?? '',
        nextDueAt: plan.nextDueAt ? new Date(plan.nextDueAt).toISOString().slice(0, 10) : '',
        tasks: plan.tasks?.map(t => t.description) ?? [],
      })
      setTaskInput('')
    } else if (isOpen && !plan) {
      setForm({
        name: '',
        description: '',
        triggerType: 'time_based',
        frequency: 'monthly',
        customDays: '',
        meterThreshold: '',
        estimatedHours: '',
        priority: 'medium',
        assetId: '',
        categoryId: '',
        nextDueAt: '',
        tasks: [],
      })
      setTaskInput('')
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

  function addTask() {
    const t = taskInput.trim()
    if (!t) return
    setForm(f => ({ ...f, tasks: [...f.tasks, t] }))
    setTaskInput('')
  }

  function removeTask(index: number) {
    setForm(f => ({ ...f, tasks: f.tasks.filter((_, i) => i !== index) }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Le nom est requis'); return }

    startTransition(async () => {
      try {
        const data = {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          triggerType: form.triggerType,
          frequency: form.triggerType === 'time_based' && form.frequency !== 'custom'
            ? form.frequency
            : form.triggerType === 'time_based' && form.frequency === 'custom'
            ? ('custom' as MaintenanceFrequency)
            : undefined,
          customDays: form.frequency === 'custom' && form.customDays
            ? parseInt(form.customDays)
            : undefined,
          meterThreshold: form.triggerType === 'meter_based' && form.meterThreshold
            ? parseFloat(form.meterThreshold)
            : undefined,
          estimatedHours: form.estimatedHours ? parseFloat(form.estimatedHours) : undefined,
          priority: form.priority,
          assetId: form.assetId || undefined,
          categoryId: form.categoryId || undefined,
          nextDueAt: form.nextDueAt || undefined,
        }

        if (plan) {
          await updateMaintenancePlan(plan.id, {
            ...data,
            frequency: data.frequency ?? null,
            customDays: data.customDays ?? null,
            meterThreshold: data.meterThreshold ?? null,
            estimatedHours: data.estimatedHours ?? null,
            assetId: data.assetId ?? null,
            categoryId: data.categoryId ?? null,
            nextDueAt: data.nextDueAt ?? null,
          })
          toast.success('Plan mis à jour')
        } else {
          await createMaintenancePlan({ ...data, tasks: form.tasks.length ? form.tasks : undefined })
          toast.success('Plan créé')
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
        <DialogContent key={plan?.id ?? 'new'} className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{plan ? 'Modifier le plan' : 'Nouveau plan de maintenance'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mp-name">Nom *</Label>
              <Input
                id="mp-name"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="Ex : Inspection mensuelle compresseur"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mp-desc">Description</Label>
              <textarea
                id="mp-desc"
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Détails du plan de maintenance..."
                rows={2}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="mp-priority">Priorité</Label>
                <select id="mp-priority" value={form.priority} onChange={e => set('priority', e.target.value)} className={SELECT_CLASS}>
                  <option value="low">Basse</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Haute</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mp-trigger">Déclencheur</Label>
                <select id="mp-trigger" value={form.triggerType} onChange={e => set('triggerType', e.target.value)} className={SELECT_CLASS}>
                  <option value="time_based">Basé sur le temps</option>
                  <option value="meter_based">Basé sur le compteur</option>
                </select>
              </div>
            </div>

            {form.triggerType === 'time_based' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="mp-freq">Fréquence</Label>
                  <select id="mp-freq" value={form.frequency} onChange={e => set('frequency', e.target.value)} className={SELECT_CLASS}>
                    {Object.entries(FREQUENCY_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                {form.frequency === 'custom' && (
                  <div className="space-y-2">
                    <Label htmlFor="mp-days">Tous les N jours</Label>
                    <Input
                      id="mp-days"
                      type="number"
                      min={1}
                      value={form.customDays}
                      onChange={e => set('customDays', e.target.value)}
                      placeholder="Ex : 45"
                    />
                  </div>
                )}
              </div>
            )}

            {form.triggerType === 'meter_based' && (
              <div className="space-y-2">
                <Label htmlFor="mp-meter">Seuil compteur</Label>
                <Input
                  id="mp-meter"
                  type="number"
                  min={0}
                  step="0.1"
                  value={form.meterThreshold}
                  onChange={e => set('meterThreshold', e.target.value)}
                  placeholder="Ex : 500 (heures, km...)"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="mp-next">Prochaine échéance</Label>
                <Input
                  id="mp-next"
                  type="date"
                  value={form.nextDueAt}
                  onChange={e => set('nextDueAt', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mp-hours">Heures estimées</Label>
                <Input
                  id="mp-hours"
                  type="number"
                  min={0}
                  step="0.5"
                  value={form.estimatedHours}
                  onChange={e => set('estimatedHours', e.target.value)}
                  placeholder="Ex : 2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="mp-asset">Actif</Label>
                <select id="mp-asset" value={form.assetId} onChange={e => set('assetId', e.target.value)} className={SELECT_CLASS}>
                  <option value="">— Aucun —</option>
                  {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mp-cat">Catégorie</Label>
                <select id="mp-cat" value={form.categoryId} onChange={e => set('categoryId', e.target.value)} className={SELECT_CLASS}>
                  <option value="">— Aucune —</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            {!plan && (
              <div className="space-y-2">
                <Label>Tâches</Label>
                <div className="flex gap-2">
                  <Input
                    value={taskInput}
                    onChange={e => setTaskInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTask() } }}
                    placeholder="Décrire une tâche..."
                  />
                  <Button type="button" variant="outline" size="icon" onClick={addTask}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {form.tasks.length > 0 && (
                  <ul className="space-y-1.5 mt-2">
                    {form.tasks.map((t, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm bg-muted/50 rounded-md px-3 py-1.5">
                        <span className="text-muted-foreground text-xs w-4">{i + 1}.</span>
                        <span className="flex-1">{t}</span>
                        <button type="button" onClick={() => removeTask(i)} className="text-muted-foreground hover:text-destructive">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {plan && (
              <div className="space-y-3 pt-4 border-t">
                <PlanPartsSection
                  planId={plan.id}
                  parts={plan.planParts ?? []}
                  spareParts={spareParts}
                />
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={pending}>
                {pending ? 'Enregistrement...' : plan ? 'Mettre à jour' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

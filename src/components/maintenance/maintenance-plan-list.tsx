'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { deleteMaintenancePlan, toggleMaintenancePlan, addMaintenanceTask, deleteMaintenanceTask } from '@/actions/maintenance'
import { MaintenancePlanFormDialog } from './maintenance-plan-form-dialog'
import { GenerateWorkOrderButton } from './generate-work-order-button'
import { Plus, Calendar, Gauge, ChevronDown, ChevronRight, ChevronUp, ChevronsUpDown, Pencil, Trash2, Power, PowerOff, CheckSquare } from 'lucide-react'
import type { MaintenanceTriggerType, MaintenanceFrequency, WorkOrderPriority } from '@/generated/prisma/enums'

type Asset = { id: string; name: string }
type Category = { id: string; name: string }
type Task = { id: string; description: string; order: number }
// SparePart full type — for the picker (includes description, quantityOnHand, supplier)
type SparePart = { id: string; name: string; partNumber: string | null; description: string | null; quantityOnHand: number; supplier: string | null }
// SparePartNarrow — for display in plan parts list (only fetched fields)
type SparePartNarrow = { id: string; name: string; partNumber: string | null }
type PlanPart = {
  id: string
  sparePartId: string | null
  name: string
  quantity: number
  sparePart?: SparePartNarrow | null
}

type Plan = {
  id: string
  name: string
  description: string | null
  triggerType: MaintenanceTriggerType
  frequency: MaintenanceFrequency | null
  customDays: number | null
  customHours: number | null
  meterThreshold: number | null
  nextMeterValue: number | null
  estimatedHours: number | null
  priority: WorkOrderPriority
  isActive: boolean
  nextDueAt: Date | null
  assetId: string | null
  categoryId: string | null
  asset: { id: string; name: string } | null
  tasks: Task[]
  planParts?: PlanPart[]
}

type Props = {
  plans: Plan[]
  assets: Asset[]
  categories: Category[]
  spareParts?: SparePart[]
}

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

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Basse',
  medium: 'Moyenne',
  high: 'Haute',
  urgent: 'Urgente',
}

const PRIORITY_VARIANTS: Record<string, 'secondary' | 'outline' | 'destructive' | 'default'> = {
  low: 'secondary',
  medium: 'outline',
  high: 'default',
  urgent: 'destructive',
}

type SortDir = 'asc' | 'desc'

function SortHeader({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
}: {
  label: string
  sortKey: string
  activeKey: string
  dir: SortDir
  onSort: (key: string) => void
}) {
  const isActive = sortKey === activeKey
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
    >
      {label}
      <span className="text-muted-foreground/50 group-hover:text-muted-foreground">
        {isActive ? (
          dir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronsUpDown className="h-3 w-3" />
        )}
      </span>
    </button>
  )
}

function formatDate(date: Date | null) {
  if (!date) return null
  return new Intl.DateTimeFormat('fr-CA', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(date))
}

function isPastDue(date: Date | null) {
  if (!date) return false
  return new Date(date) < new Date()
}

function PlanCard({ plan, assets, categories, spareParts = [] }: { plan: Plan; assets: Asset[]; categories: Category[]; spareParts?: SparePart[] }) {
  const [expanded, setExpanded] = useState(false)
  const [taskInput, setTaskInput] = useState('')
  const [pending, startTransition] = useTransition()

  function handleToggle() {
    startTransition(async () => {
      try {
        await toggleMaintenancePlan(plan.id, !plan.isActive)
        toast.success(plan.isActive ? 'Plan désactivé' : 'Plan activé')
      } catch {
        toast.error('Erreur lors de la mise à jour')
      }
    })
  }

  function handleDelete() {
    if (!confirm('Supprimer ce plan de maintenance ?')) return
    startTransition(async () => {
      try {
        await deleteMaintenancePlan(plan.id)
        toast.success('Plan supprimé')
      } catch {
        toast.error('Erreur lors de la suppression')
      }
    })
  }

  function handleAddTask() {
    const t = taskInput.trim()
    if (!t) return
    startTransition(async () => {
      try {
        await addMaintenanceTask(plan.id, t)
        setTaskInput('')
        toast.success('Tâche ajoutée')
      } catch {
        toast.error('Erreur lors de l\'ajout')
      }
    })
  }

  function handleDeleteTask(taskId: string) {
    startTransition(async () => {
      try {
        await deleteMaintenanceTask(taskId)
        toast.success('Tâche supprimée')
      } catch {
        toast.error('Erreur lors de la suppression')
      }
    })
  }

  const pastDue = isPastDue(plan.nextDueAt)

  return (
    <div className={`border rounded-lg bg-card ${!plan.isActive ? 'opacity-60' : ''}`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="mt-0.5 text-muted-foreground hover:text-foreground"
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{plan.name}</span>
              {!plan.isActive && (
                <Badge variant="secondary" className="text-xs">Inactif</Badge>
              )}
              <Badge variant={PRIORITY_VARIANTS[plan.priority]} className="text-xs">
                {PRIORITY_LABELS[plan.priority]}
              </Badge>
            </div>

            {plan.description && (
              <p className="text-muted-foreground text-xs mt-0.5 truncate">{plan.description}</p>
            )}

            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
              {plan.triggerType === 'time_based' ? (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {plan.frequency ? FREQUENCY_LABELS[plan.frequency] : '—'}
                  {plan.frequency === 'custom' && plan.customDays ? ` (${plan.customDays}j)` : ''}
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Gauge className="h-3 w-3" />
                  {plan.nextMeterValue != null
                    ? <>Prochain BT à <strong>{plan.nextMeterValue} h</strong></>
                    : <>Seuil : {plan.meterThreshold ?? '—'} h</>
                  }
                </span>
              )}

              {plan.nextDueAt && (
                <span className={`flex items-center gap-1 ${pastDue ? 'text-destructive font-medium' : ''}`}>
                  {pastDue ? '⚠ En retard' : 'Échéance'} : {formatDate(plan.nextDueAt)}
                </span>
              )}

              {plan.asset && (
                <span className="text-muted-foreground">Actif : {plan.asset.name}</span>
              )}

              {plan.estimatedHours && (
                <span>{plan.estimatedHours}h estimées</span>
              )}

              <span className="flex items-center gap-1">
                <CheckSquare className="h-3 w-3" />
                {plan.tasks.length} tâche{plan.tasks.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <GenerateWorkOrderButton planId={plan.id} planName={plan.name} disabled={!plan.isActive} />
            <MaintenancePlanFormDialog plan={{ ...plan, tasks: plan.tasks, planParts: plan.planParts }} assets={assets} categories={categories} spareParts={spareParts}>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </MaintenancePlanFormDialog>

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleToggle}
              disabled={pending}
              title={plan.isActive ? 'Désactiver' : 'Activer'}
            >
              {plan.isActive
                ? <PowerOff className="h-3.5 w-3.5 text-muted-foreground" />
                : <Power className="h-3.5 w-3.5 text-green-600" />
              }
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={handleDelete}
              disabled={pending}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t px-4 py-3 space-y-3">
          {plan.planParts && plan.planParts.length > 0 && (
            <div className="mb-1">
              <p className="text-xs font-medium text-muted-foreground">Pièces requises ({plan.planParts.length}) :</p>
              <ul className="text-xs text-muted-foreground list-disc list-inside">
                {plan.planParts.map(p => (
                  <li key={p.id}>{p.name} × {p.quantity}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tâches</p>

          {plan.tasks.length === 0 && (
            <p className="text-sm text-muted-foreground italic">Aucune tâche définie</p>
          )}

          {plan.tasks.map((task, i) => (
            <div key={task.id} className="flex items-start gap-2 text-sm">
              <span className="text-muted-foreground text-xs w-5 shrink-0 pt-0.5">{i + 1}.</span>
              <span className="flex-1">{task.description}</span>
              <button
                type="button"
                onClick={() => handleDeleteTask(task.id)}
                disabled={pending}
                className="text-muted-foreground hover:text-destructive shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          <div className="flex gap-2 pt-1">
            <input
              value={taskInput}
              onChange={e => setTaskInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTask() } }}
              placeholder="Ajouter une tâche..."
              className="flex-1 h-8 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
            />
            <Button type="button" size="sm" variant="outline" onClick={handleAddTask} disabled={pending}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Ajouter
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export function MaintenancePlanList({ plans, assets, categories, spareParts = [] }: Props) {
  const [sortKey, setSortKey] = useState<string>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function sortPlans(arr: Plan[]) {
    return [...arr].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'name': cmp = a.name.localeCompare(b.name, 'fr'); break
        case 'priority': {
          const order: Record<string, number> = { low: 0, medium: 1, high: 2, urgent: 3 }
          cmp = (order[a.priority] ?? 0) - (order[b.priority] ?? 0)
          break
        }
        case 'nextDueAt': {
          const da = a.nextDueAt ? new Date(a.nextDueAt).getTime() : Infinity
          const db2 = b.nextDueAt ? new Date(b.nextDueAt).getTime() : Infinity
          cmp = da - db2
          break
        }
        case 'tasks': cmp = a.tasks.length - b.tasks.length; break
        default: cmp = 0
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
  }

  const activePlans = sortPlans(plans.filter(p => p.isActive))
  const inactivePlans = sortPlans(plans.filter(p => !p.isActive))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {activePlans.length} plan{activePlans.length !== 1 ? 's' : ''} actif{activePlans.length !== 1 ? 's' : ''}
            {inactivePlans.length > 0 ? ` · ${inactivePlans.length} inactif${inactivePlans.length !== 1 ? 's' : ''}` : ''}
          </p>
        </div>
        <MaintenancePlanFormDialog assets={assets} categories={categories} spareParts={spareParts}>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau plan
          </Button>
        </MaintenancePlanFormDialog>
      </div>

      {plans.length > 0 && (
        <div className="hidden sm:flex gap-4 items-center px-2 py-1.5 text-xs border-b">
          <SortHeader label="Nom" sortKey="name" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
          <SortHeader label="Priorité" sortKey="priority" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
          <SortHeader label="Prochaine échéance" sortKey="nextDueAt" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
          <SortHeader label="Tâches" sortKey="tasks" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
        </div>
      )}

      {plans.length === 0 && (
        <div className="text-center py-12 border rounded-lg bg-muted/30">
          <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium">Aucun plan de maintenance</p>
          <p className="text-xs text-muted-foreground mt-1">Créez votre premier plan pour planifier vos interventions préventives.</p>
          <MaintenancePlanFormDialog assets={assets} categories={categories} spareParts={spareParts}>
            <Button size="sm" className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Créer un plan
            </Button>
          </MaintenancePlanFormDialog>
        </div>
      )}

      {activePlans.length > 0 && (
        <div className="space-y-2">
          {activePlans.map(plan => (
            <PlanCard key={plan.id} plan={plan} assets={assets} categories={categories} spareParts={spareParts} />
          ))}
        </div>
      )}

      {inactivePlans.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Inactifs</p>
          {inactivePlans.map(plan => (
            <PlanCard key={plan.id} plan={plan} assets={assets} categories={categories} spareParts={spareParts} />
          ))}
        </div>
      )}
    </div>
  )
}

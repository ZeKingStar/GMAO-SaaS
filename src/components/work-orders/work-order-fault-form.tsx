'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { setWorkOrderFault } from '@/actions/work-orders'
import { FAULT_CATEGORIES, FAULT_CATEGORY_LABELS, type FaultCategory } from '@/lib/closure-requirements'

type Props = {
  workOrderId: string
  initialCategory: string | null
  initialProblem: string | null
  initialCause: string | null
  initialRemedy: string | null
  required: boolean
}

const SELECT_CLASS = 'h-9 rounded-lg border border-input bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50'
const TEXTAREA_CLASS = 'w-full rounded-lg border border-input bg-background px-2.5 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring/50'

export function WorkOrderFaultForm({ workOrderId, initialCategory, initialProblem, initialCause, initialRemedy, required }: Props) {
  const [, startTransition] = useTransition()
  const [category, setCategory] = useState(initialCategory ?? '')
  const [problem, setProblem] = useState(initialProblem ?? '')
  const [cause, setCause] = useState(initialCause ?? '')
  const [remedy, setRemedy] = useState(initialRemedy ?? '')
  const [dirty, setDirty] = useState(false)

  function handleChange<T extends string>(setter: (v: T) => void) {
    return (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
      setter(e.target.value as T)
      setDirty(true)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      try {
        await setWorkOrderFault(workOrderId, {
          faultCategory: category || null,
          faultProblem: problem.trim() || null,
          faultCause: cause.trim() || null,
          faultRemedy: remedy.trim() || null,
        })
        toast.success('Code de panne enregistré')
        setDirty(false)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erreur')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">
          Code de panne {required && <span className="text-destructive">*</span>}
        </h2>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium block">Catégorie</label>
        <select
          value={category}
          onChange={handleChange(setCategory)}
          className={`w-full ${SELECT_CLASS}`}
        >
          <option value="">— Sélectionner —</option>
          {FAULT_CATEGORIES.map(c => (
            <option key={c} value={c}>{FAULT_CATEGORY_LABELS[c as FaultCategory]}</option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium block">Problème observé</label>
        <textarea
          value={problem}
          onChange={handleChange(setProblem)}
          rows={2}
          placeholder="Décrire le problème observé…"
          className={TEXTAREA_CLASS}
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium block">Cause identifiée</label>
        <textarea
          value={cause}
          onChange={handleChange(setCause)}
          rows={2}
          placeholder="Ex: roulement usé, fusible grillé..."
          className={TEXTAREA_CLASS}
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium block">Remède appliqué</label>
        <textarea
          value={remedy}
          onChange={handleChange(setRemedy)}
          rows={2}
          placeholder="Ex: remplacement roulement, reset disjoncteur..."
          className={TEXTAREA_CLASS}
        />
      </div>
      {dirty && (
        <div className="flex justify-end">
          <Button type="submit" size="sm">Enregistrer</Button>
        </div>
      )}
    </form>
  )
}

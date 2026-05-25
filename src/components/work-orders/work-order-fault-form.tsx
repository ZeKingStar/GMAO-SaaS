'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { setWorkOrderFault } from '@/actions/work-orders'
import { FAULT_CATEGORIES, FAULT_CATEGORY_LABELS, type FaultCategory } from '@/lib/closure-requirements'

type Props = {
  workOrderId: string
  faultCategory: string | null
  faultDescription: string | null
  required: boolean
}

const SELECT_CLASS = 'h-9 rounded-lg border border-input bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50'

export function WorkOrderFaultForm({ workOrderId, faultCategory, faultDescription, required }: Props) {
  const [, startTransition] = useTransition()
  const [form, setForm] = useState({
    category: faultCategory ?? '',
    description: faultDescription ?? '',
  })
  const [dirty, setDirty] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      try {
        await setWorkOrderFault(workOrderId, {
          faultCategory: form.category || null,
          faultDescription: form.description.trim() || null,
        })
        toast.success('Code de panne enregistré')
        setDirty(false)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erreur')
      }
    })
  }

  function set<K extends 'category' | 'description'>(key: K, value: string) {
    setForm(f => ({ ...f, [key]: value }))
    setDirty(true)
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
          value={form.category}
          onChange={e => set('category', e.target.value)}
          className={`w-full ${SELECT_CLASS}`}
        >
          <option value="">— Sélectionner —</option>
          {FAULT_CATEGORIES.map(c => (
            <option key={c} value={c}>{FAULT_CATEGORY_LABELS[c as FaultCategory]}</option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium block">Description</label>
        <textarea
          value={form.description}
          onChange={e => set('description', e.target.value)}
          rows={3}
          placeholder="Décrire la panne observée…"
          className="w-full rounded-lg border border-input bg-background px-2.5 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring/50"
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

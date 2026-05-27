'use client'

import { useTransition } from 'react'
import { CheckSquare } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { toggleChecklistItem, setChecklistMeasure } from '@/actions/work-orders'

type ChecklistItem = {
  id: string
  order: number
  description: string
  checked: boolean
  measureValue: string | null
}

type Props = {
  workOrderId: string
  items: ChecklistItem[]
  readOnly?: boolean
}

export function WorkOrderChecklist({ workOrderId: _workOrderId, items, readOnly = false }: Props) {
  const [pending, startTransition] = useTransition()

  if (items.length === 0) return null

  const sorted = [...items].sort((a, b) => a.order - b.order)
  const completed = sorted.filter(i => i.checked).length
  const total = sorted.length

  function handleToggle(itemId: string, checked: boolean) {
    startTransition(async () => {
      try {
        await toggleChecklistItem(itemId, checked)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erreur')
      }
    })
  }

  function handleMeasureBlur(itemId: string, newValue: string, oldValue: string | null) {
    const cleaned = newValue.trim()
    const oldCleaned = (oldValue ?? '').trim()
    if (cleaned === oldCleaned) return
    startTransition(async () => {
      try {
        await setChecklistMeasure(itemId, cleaned || null)
        toast.success('Mesure enregistrée')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erreur')
      }
    })
  }

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Checklist</h3>
        </div>
        <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {completed}/{total} complétés
        </span>
      </div>

      <ul className="flex flex-col gap-3">
        {sorted.map(item => (
          <li key={item.id} className="flex flex-col gap-2 p-3 rounded-lg border bg-card">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={item.checked}
                onChange={e => handleToggle(item.id, e.target.checked)}
                disabled={readOnly || pending}
                className="mt-1 h-5 w-5 rounded border-input accent-primary"
              />
              <span className="flex-1">
                <span className="text-xs text-muted-foreground block">Étape {item.order + 1}</span>
                <span
                  className={`block text-sm ${
                    item.checked ? 'line-through text-muted-foreground' : ''
                  }`}
                >
                  {item.description}
                </span>
              </span>
            </label>
            <Input
              type="text"
              placeholder="Mesure / valeur (optionnel)"
              defaultValue={item.measureValue ?? ''}
              disabled={readOnly}
              onBlur={e => handleMeasureBlur(item.id, e.target.value, item.measureValue)}
              maxLength={200}
              className="w-full"
            />
          </li>
        ))}
      </ul>
    </div>
  )
}

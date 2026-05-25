'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { updateClosureRequirements } from '@/actions/settings'
import {
  type ClosureRequirements,
  CLOSURE_FIELD_LABELS,
} from '@/lib/closure-requirements'

type Props = {
  initial: ClosureRequirements
}

export function ClosureRequirementsSection({ initial }: Props) {
  const [pending, startTransition] = useTransition()
  const [req, setReq] = useState<ClosureRequirements>(initial)
  const dirty =
    req.faultCode !== initial.faultCode ||
    req.timeSpent !== initial.timeSpent ||
    req.partsUsed !== initial.partsUsed

  function toggle(key: keyof ClosureRequirements) {
    setReq(r => ({ ...r, [key]: !r[key] }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      try {
        await updateClosureRequirements(req)
        toast.success('Exigences de clôture enregistrées')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erreur')
      }
    })
  }

  const fields: { key: keyof ClosureRequirements; label: string }[] = [
    { key: 'faultCode', label: CLOSURE_FIELD_LABELS.faultCode },
    { key: 'timeSpent', label: CLOSURE_FIELD_LABELS.timeSpent },
    { key: 'partsUsed', label: CLOSURE_FIELD_LABELS.partsUsed },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Choisissez les champs que le technicien doit obligatoirement remplir avant de pouvoir
        marquer un bon de travail comme « Résolu » ou « Fermé ».
      </p>
      <div className="space-y-2">
        {fields.map(f => (
          <label key={f.key} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 cursor-pointer">
            <input
              type="checkbox"
              checked={req[f.key]}
              onChange={() => toggle(f.key)}
              className="mt-0.5 h-4 w-4 rounded border-input"
            />
            <span className="text-sm">{f.label}</span>
          </label>
        ))}
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={!dirty || pending}>
          {pending ? 'Enregistrement…' : 'Sauvegarder'}
        </Button>
      </div>
    </form>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { updateEscalationConfig } from '@/actions/settings'
import {
  type EscalationConfig,
  ESCALATION_FIELD_LABELS,
} from '@/lib/escalation-config'

type Props = { initial: EscalationConfig }

export function EscalationConfigSection({ initial }: Props) {
  const [pending, startTransition] = useTransition()
  const [cfg, setCfg] = useState<EscalationConfig>(initial)
  const dirty = cfg.enabled !== initial.enabled || cfg.delayHours !== initial.delayHours

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!Number.isFinite(cfg.delayHours) || cfg.delayHours <= 0 || cfg.delayHours > 168) {
      toast.error('Le délai doit être entre 1 et 168 heures')
      return
    }
    startTransition(async () => {
      try {
        await updateEscalationConfig(cfg)
        toast.success("Configuration d'escalade enregistrée")
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erreur')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Envoie automatiquement un email aux administrateurs et gestionnaires lorsqu'un bon de
        travail de priorité <strong>urgente</strong> n'a pas été résolu après le délai configuré.
        Le cron tourne toutes les heures.
      </p>

      <label className="flex items-start gap-3 p-3 rounded-lg border bg-card cursor-pointer">
        <input
          type="checkbox"
          checked={cfg.enabled}
          onChange={() => setCfg(c => ({ ...c, enabled: !c.enabled }))}
          className="mt-0.5 h-4 w-4 rounded border-input"
        />
        <span className="text-sm">{ESCALATION_FIELD_LABELS.enabled}</span>
      </label>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="delayHours">
          {ESCALATION_FIELD_LABELS.delayHours}
        </label>
        <Input
          id="delayHours"
          type="number"
          min={1}
          max={168}
          step={1}
          value={cfg.delayHours}
          onChange={(e) => setCfg(c => ({ ...c, delayHours: Number(e.target.value) }))}
          disabled={!cfg.enabled}
          className="max-w-xs"
        />
        <p className="text-xs text-muted-foreground">
          Entre 1 et 168 heures (1 semaine). Par défaut : 4 heures.
        </p>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={!dirty || pending}>
          {pending ? 'Enregistrement…' : 'Sauvegarder'}
        </Button>
      </div>
    </form>
  )
}

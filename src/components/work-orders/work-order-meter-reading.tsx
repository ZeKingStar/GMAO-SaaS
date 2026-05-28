'use client'

import { useState, useTransition } from 'react'
import { Gauge } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { recordMeterReading } from '@/actions/work-orders'

type Meter = { id: string; name: string; unit: string; value: number }

type Props = {
  workOrderId: string
  meters: Meter[]
  currentReading: number | null
  isLocked: boolean
}

export function WorkOrderMeterReading({ workOrderId, meters, currentReading, isLocked }: Props) {
  const [value, setValue] = useState(currentReading?.toString() ?? '')
  const [isPending, startTransition] = useTransition()

  const meter = meters[0]
  if (!meter) return null

  function handleSave() {
    const reading = parseFloat(value)
    if (!Number.isFinite(reading) || reading < 0) {
      toast.error('Valeur invalide')
      return
    }
    startTransition(async () => {
      try {
        await recordMeterReading(workOrderId, reading)
        toast.success('Relevé enregistré — compteur et plans mis à jour')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erreur')
      }
    })
  }

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Gauge className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Relevé compteur</h2>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{meter.name}</span>
        <span>—</span>
        <span>Valeur actuelle : <strong>{meter.value} {meter.unit}</strong></span>
      </div>
      {!isLocked ? (
        <div className="flex gap-2">
          <Input
            type="number"
            min={0}
            step="0.1"
            placeholder={`Nouveau relevé (${meter.unit})`}
            value={value}
            onChange={e => setValue(e.target.value)}
            className="w-48"
          />
          <Button size="sm" onClick={handleSave} disabled={isPending}>
            {isPending ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      ) : (
        currentReading !== null && (
          <p className="text-sm text-muted-foreground">
            Relevé saisi : <strong>{currentReading} {meter.unit}</strong>
          </p>
        )
      )}
    </div>
  )
}

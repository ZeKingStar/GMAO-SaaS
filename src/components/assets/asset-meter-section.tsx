'use client'

import { useState, useTransition } from 'react'
import { Gauge } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { recordMeterReadingOnAsset } from '@/actions/work-orders'

type Meter = { id: string; name: string; unit: string; value: number }

interface AssetMeterSectionProps {
  assetId: string
  meters: Meter[]
  canEdit?: boolean
}

export function AssetMeterSection({ assetId, meters, canEdit = true }: AssetMeterSectionProps) {
  const meter = meters[0]
  const [value, setValue] = useState(meter ? meter.value.toString() : '')
  const [isPending, startTransition] = useTransition()

  if (!meter) return null

  function handleSave() {
    const reading = parseFloat(value)
    if (!Number.isFinite(reading) || reading < 0) {
      toast.error('Valeur invalide — entrez un nombre positif')
      return
    }
    startTransition(async () => {
      try {
        await recordMeterReadingOnAsset(assetId, reading)
        toast.success('Relevé enregistré — compteur et plans mis à jour')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erreur lors de l\'enregistrement')
      }
    })
  }

  return (
    <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">{meter.name}</span>
        <span className="text-xs text-muted-foreground">—</span>
        <span className="text-xs">
          Valeur actuelle : <strong>{meter.value} {meter.unit}</strong>
        </span>
      </div>
      {canEdit && (
        <div className="flex gap-2 items-center">
          <Input
            type="number"
            min={0}
            step="0.1"
            placeholder={`Nouveau relevé (${meter.unit})`}
            value={value}
            onChange={e => setValue(e.target.value)}
            className="h-7 w-44 text-xs"
          />
          <Button size="sm" className="h-7 text-xs" onClick={handleSave} disabled={isPending}>
            {isPending ? 'Enregistrement...' : 'Enregistrer le relevé'}
          </Button>
        </div>
      )}
    </div>
  )
}

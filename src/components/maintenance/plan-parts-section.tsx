'use client'

import { useState, useTransition } from 'react'
import { Package, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { addPlanPart, deletePlanPart } from '@/actions/maintenance'

type SparePart = { id: string; name: string; partNumber: string | null }

type PlanPart = {
  id: string
  sparePartId: string | null
  name: string
  quantity: number
  sparePart?: SparePart | null
}

type Props = {
  planId: string
  parts: PlanPart[]
  spareParts: SparePart[]
}

const SELECT_CLASS =
  'h-9 rounded-lg border border-input bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50'
const INPUT_CLASS =
  'h-9 rounded-lg border border-input bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50'

export function PlanPartsSection({ planId, parts, spareParts }: Props) {
  const [, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [selectedSparePartId, setSelectedSparePartId] = useState('')
  const [freeName, setFreeName] = useState('')
  const [quantity, setQuantity] = useState('1')

  const isHorsInventaire = selectedSparePartId === '__free__'

  function resetForm() {
    setSelectedSparePartId('')
    setFreeName('')
    setQuantity('1')
    setShowForm(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const parsedQty = parseFloat(quantity)
    if (!Number.isFinite(parsedQty) || parsedQty <= 0) {
      toast.error('Quantité invalide (doit être > 0)')
      return
    }

    if (isHorsInventaire) {
      if (!freeName.trim()) {
        toast.error('Le nom de la pièce est requis')
        return
      }
    } else if (!selectedSparePartId) {
      toast.error('Choisissez une pièce ou sélectionnez "Pièce hors inventaire"')
      return
    }

    const sparePartId = isHorsInventaire ? null : selectedSparePartId
    const name = isHorsInventaire
      ? freeName.trim()
      : (spareParts.find(s => s.id === selectedSparePartId)?.name ?? freeName.trim())

    startTransition(async () => {
      try {
        await addPlanPart(planId, { sparePartId, name, quantity: parsedQty })
        toast.success('Pièce ajoutée')
        resetForm()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erreur')
      }
    })
  }

  function handleDelete(partId: string) {
    if (!confirm('Supprimer cette pièce requise du plan ?')) return
    startTransition(async () => {
      try {
        await deletePlanPart(partId)
        toast.success('Pièce supprimée')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erreur')
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold">Pièces requises</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ces pièces seront pré-remplies sur les BT générés depuis ce plan. Aucun décompte de stock à la création.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => { setShowForm(v => !v); if (showForm) resetForm() }}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Ajouter
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border rounded-lg p-3 space-y-3 bg-muted/30">
          <select
            value={selectedSparePartId}
            onChange={e => setSelectedSparePartId(e.target.value)}
            className={`w-full ${SELECT_CLASS}`}
          >
            <option value="">— Choisir une pièce inventaire —</option>
            {spareParts.map(sp => (
              <option key={sp.id} value={sp.id}>
                {sp.name}{sp.partNumber ? ` (${sp.partNumber})` : ''}
              </option>
            ))}
            <option value="__free__">— Pièce hors inventaire —</option>
          </select>

          {isHorsInventaire && (
            <input
              placeholder="Nom de la pièce"
              value={freeName}
              onChange={e => setFreeName(e.target.value)}
              className={`w-full ${INPUT_CLASS}`}
            />
          )}

          <div className="flex gap-2">
            <Input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Quantité"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              className="w-32"
            />
            <div className="flex-1" />
            <Button type="button" variant="ghost" size="sm" onClick={resetForm}>Annuler</Button>
            <Button type="submit" size="sm">Ajouter la pièce</Button>
          </div>
        </form>
      )}

      {parts.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">Aucune pièce requise définie.</p>
      ) : (
        <div className="space-y-1.5">
          {parts.map(p => (
            <div
              key={p.id}
              className="flex items-center justify-between py-1.5 border-b last:border-0"
            >
              <div className="flex items-center gap-2 text-sm min-w-0">
                <Package className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="font-medium truncate">
                  {p.sparePart
                    ? `${p.sparePart.name}${p.sparePart.partNumber ? ` (${p.sparePart.partNumber})` : ''}`
                    : p.name}
                </span>
                {p.sparePart && (
                  <span className="text-xs text-muted-foreground">(inventaire)</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono tabular-nums">x {p.quantity}</span>
                <button
                  type="button"
                  onClick={() => handleDelete(p.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

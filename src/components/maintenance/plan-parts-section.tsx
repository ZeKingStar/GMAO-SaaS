'use client'

import { useState, useTransition } from 'react'
import { Package, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { addPlanPart, deletePlanPart } from '@/actions/maintenance'
import { SparePartPickerDialog } from './spare-part-picker-dialog'

// SparePart full type — used for the picker (description, quantityOnHand, supplier needed)
type SparePart = {
  id: string
  name: string
  partNumber: string | null
  description: string | null
  quantityOnHand: number
  supplier: string | null
}

// SparePartNarrow — used in PlanPart for display only (only id, name, partNumber fetched from DB)
type SparePartNarrow = { id: string; name: string; partNumber: string | null }

type PlanPart = {
  id: string
  sparePartId: string | null
  name: string
  quantity: number
  sparePart?: SparePartNarrow | null
}

type Props = {
  planId: string
  parts: PlanPart[]
  spareParts: SparePart[]
}

const INPUT_CLASS =
  'h-9 rounded-lg border border-input bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50'

export function PlanPartsSection({ planId, parts, spareParts }: Props) {
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [selectedSparePartId, setSelectedSparePartId] = useState('')
  const [selectedPartName, setSelectedPartName] = useState('')
  const [freeName, setFreeName] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [pickerOpen, setPickerOpen] = useState(false)

  const isHorsInventaire = selectedSparePartId === '__free__'

  function resetForm() {
    setSelectedSparePartId('')
    setSelectedPartName('')
    setFreeName('')
    setQuantity('1')
    setShowForm(false)
  }

  function handleAddPart(keepFormOpen: boolean) {
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
        if (keepFormOpen) {
          setSelectedSparePartId('')
          setSelectedPartName('')
          setFreeName('')
          setQuantity('1')
        } else {
          resetForm()
        }
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
        <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
          {!isHorsInventaire ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="flex-1 h-9 rounded-lg border border-input bg-background px-2.5 text-sm text-left focus:outline-none focus:ring-2 focus:ring-ring/50 truncate"
              >
                {selectedPartName ? selectedPartName : <span className="text-muted-foreground">— Choisir une pièce inventaire —</span>}
              </button>
              {selectedSparePartId && (
                <button
                  type="button"
                  onClick={() => { setSelectedSparePartId(''); setSelectedPartName('') }}
                  className="h-9 px-2 text-muted-foreground hover:text-foreground"
                  title="Effacer la sélection"
                >
                  ×
                </button>
              )}
            </div>
          ) : (
            <input
              placeholder="Nom de la pièce hors inventaire"
              value={freeName}
              onChange={e => setFreeName(e.target.value)}
              className={`w-full ${INPUT_CLASS}`}
            />
          )}
          <button
            type="button"
            onClick={() => {
              if (isHorsInventaire) {
                setSelectedSparePartId('')
              } else {
                setSelectedSparePartId('__free__')
                setSelectedPartName('')
              }
            }}
            className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline text-left"
          >
            {isHorsInventaire ? "← Choisir depuis l'inventaire" : 'Pièce hors inventaire →'}
          </button>

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
            <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
              Annuler
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAddPart(true)}
              disabled={isPending}
            >
              + Continuer
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => handleAddPart(false)}
              disabled={isPending}
            >
              Ajouter
            </Button>
          </div>
        </div>
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

      <SparePartPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        spareParts={spareParts}
        onSelect={(id, name) => {
          setSelectedSparePartId(id)
          setSelectedPartName(name)
        }}
      />
    </div>
  )
}

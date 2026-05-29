'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, Package, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { upsertWorkOrderPart, deleteWorkOrderPart } from '@/actions/work-orders'

type SparePartLite = { id: string; name: string; partNumber: string | null; quantityOnHand: number; unitCost: number | null }

type WOPart = {
  id: string
  sparePartId: string | null
  name: string
  quantity: number
  unitCost: number | null
  sparePart: SparePartLite | null
}

type Props = {
  workOrderId: string
  parts: WOPart[]
  spareParts: SparePartLite[]
  status: string
}

const SELECT_CLASS = 'h-9 rounded-lg border border-input bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50'
const INPUT_CLASS = 'h-9 rounded-lg border border-input bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50'

export function WorkOrderParts({ workOrderId, parts, spareParts, status }: Props) {
  const isLocked = status === 'closed' || status === 'resolved'
  const [, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [mode, setMode] = useState<'inventory' | 'free'>('inventory')
  const [form, setForm] = useState({ sparePartId: '', name: '', quantity: '1' })

  function resetForm() {
    setForm({ sparePartId: '', name: '', quantity: '1' })
    setMode('inventory')
    setEditId(null)
    setShowForm(false)
  }

  function handleEdit(p: WOPart) {
    setEditId(p.id)
    if (p.sparePartId) {
      setMode('inventory')
      setForm({ sparePartId: p.sparePartId, name: '', quantity: String(p.quantity) })
    } else {
      setMode('free')
      setForm({ sparePartId: '', name: p.name, quantity: String(p.quantity) })
    }
    setShowForm(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const qty = parseFloat(form.quantity)
    if (!Number.isFinite(qty) || qty <= 0) { toast.error('Quantité invalide'); return }
    const payload = mode === 'inventory'
      ? { id: editId ?? undefined, sparePartId: form.sparePartId || null, name: '', quantity: qty }
      : { id: editId ?? undefined, sparePartId: null, name: form.name.trim(), quantity: qty }
    if (mode === 'inventory' && !form.sparePartId) { toast.error('Pièce inventaire requise'); return }
    if (mode === 'free' && !payload.name) { toast.error('Nom de pièce requis'); return }
    if (mode === 'inventory') {
      // Server résout name depuis l'inventaire — on passe un placeholder
      payload.name = spareParts.find(sp => sp.id === form.sparePartId)?.name ?? 'Pièce'
    }
    startTransition(async () => {
      try {
        await upsertWorkOrderPart(workOrderId, payload)
        toast.success(editId ? 'Pièce mise à jour' : 'Pièce ajoutée')
        resetForm()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erreur')
      }
    })
  }

  function handleDelete(partId: string) {
    if (!confirm('Supprimer cette pièce du BT ?')) return
    startTransition(async () => {
      try { await deleteWorkOrderPart(workOrderId, partId); toast.success('Pièce supprimée') }
      catch (e) { toast.error(e instanceof Error ? e.message : 'Erreur') }
    })
  }

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Pièces utilisées ({parts.length})</h2>
        {!isLocked && (
          <Button variant="outline" size="sm" onClick={() => { setShowForm(v => !v); if (showForm) resetForm() }}>
            <Plus className="h-4 w-4 mr-1.5" />Ajouter
          </Button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border rounded-lg p-3 space-y-3 bg-muted/30">
          <div className="flex gap-2 text-xs">
            <button type="button" onClick={() => setMode('inventory')}
              className={`flex-1 h-8 rounded-md border ${mode === 'inventory' ? 'bg-primary text-primary-foreground border-primary' : 'border-input'}`}>
              Depuis l&apos;inventaire
            </button>
            <button type="button" onClick={() => setMode('free')}
              className={`flex-1 h-8 rounded-md border ${mode === 'free' ? 'bg-primary text-primary-foreground border-primary' : 'border-input'}`}>
              Pièce libre
            </button>
          </div>

          {mode === 'inventory' ? (
            <select
              value={form.sparePartId}
              onChange={e => setForm(f => ({ ...f, sparePartId: e.target.value }))}
              className={`w-full ${SELECT_CLASS}`}
            >
              <option value="">— Choisir une pièce —</option>
              {spareParts.map(sp => (
                <option key={sp.id} value={sp.id}>
                  {sp.name}{sp.partNumber ? ` (${sp.partNumber})` : ''} — stock: {sp.quantityOnHand}
                </option>
              ))}
            </select>
          ) : (
            <input
              placeholder="Nom de la pièce"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className={`w-full ${INPUT_CLASS}`}
            />
          )}

          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Quantité"
              value={form.quantity}
              onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
              className={`w-32 ${INPUT_CLASS}`}
            />
            <div className="flex-1" />
            <Button type="button" variant="ghost" size="sm" onClick={resetForm}>Annuler</Button>
            <Button type="submit" size="sm">{editId ? 'Mettre à jour' : 'Ajouter'}</Button>
          </div>
          {mode === 'inventory' && (
            <p className="text-xs text-muted-foreground">
              Le stock sera décrémenté automatiquement à l&apos;ajout (uniquement à la création, pas à la modification).
            </p>
          )}
        </form>
      )}

      {parts.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune pièce enregistrée.</p>
      ) : (
        <div className="space-y-2">
          {parts.map(p => (
            <div key={p.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
              <div className="flex items-center gap-2 text-sm min-w-0">
                <Package className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="font-medium truncate">{p.name}</span>
                {p.sparePart && (
                  <span className="text-xs text-muted-foreground">(inventaire)</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono tabular-nums">x {p.quantity}</span>
                {p.unitCost !== null && (
                  <span className="text-muted-foreground">— {(p.quantity * p.unitCost).toFixed(2)} $</span>
                )}
                {!isLocked && <>
                  <button onClick={() => handleEdit(p)} className="text-muted-foreground hover:text-foreground">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

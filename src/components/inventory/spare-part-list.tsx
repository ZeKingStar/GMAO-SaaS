'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { deleteSparePart, adjustQuantity } from '@/actions/inventory'
import { SparePartFormDialog } from './spare-part-form-dialog'
import { Plus, Pencil, Trash2, Minus, Package, AlertTriangle } from 'lucide-react'

type SparePart = {
  id: string
  name: string
  partNumber: string | null
  description: string | null
  unit: string | null
  quantityOnHand: number
  quantityMin: number | null
  unitCost: number | null
  supplier: string | null
  storageLocation: string | null
}

type Props = { parts: SparePart[] }

function StockBadge({ qty, min }: { qty: number; min: number | null }) {
  if (min !== null && qty <= 0) return <Badge variant="destructive" className="text-xs">Rupture</Badge>
  if (min !== null && qty <= min) return <Badge variant="default" className="text-xs bg-orange-500 hover:bg-orange-500">Stock bas</Badge>
  return <Badge variant="secondary" className="text-xs">{qty > 0 ? 'En stock' : '0'}</Badge>
}

function AdjustButton({ partId, delta, children }: { partId: string; delta: number; children: React.ReactNode }) {
  const [, startTransition] = useTransition()

  function handle() {
    startTransition(async () => {
      try {
        await adjustQuantity(partId, delta)
      } catch {
        toast.error('Erreur lors de l\'ajustement')
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handle}
      className="flex items-center justify-center w-6 h-6 rounded border border-input hover:bg-muted text-muted-foreground hover:text-foreground transition-colors text-xs"
    >
      {children}
    </button>
  )
}

export function SparePartList({ parts }: Props) {
  const [, startTransition] = useTransition()
  const [search, setSearch] = useState('')

  const lowStock = parts.filter(p => p.quantityMin !== null && p.quantityOnHand <= p.quantityMin)

  const filtered = parts.filter(p => {
    const q = search.toLowerCase()
    return !q || p.name.toLowerCase().includes(q) || p.partNumber?.toLowerCase().includes(q) || p.supplier?.toLowerCase().includes(q)
  })

  function handleDelete(part: SparePart) {
    if (!confirm(`Supprimer "${part.name}" de l'inventaire ?`)) return
    startTransition(async () => {
      try { await deleteSparePart(part.id); toast.success('Pièce supprimée') }
      catch { toast.error('Erreur lors de la suppression') }
    })
  }

  const totalValue = parts.reduce((sum, p) => sum + (p.quantityOnHand * (p.unitCost ?? 0)), 0)

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="border rounded-lg p-3 bg-card">
          <p className="text-xs text-muted-foreground">Références</p>
          <p className="text-xl font-bold mt-0.5">{parts.length}</p>
        </div>
        <div className="border rounded-lg p-3 bg-card">
          <p className="text-xs text-muted-foreground">Alertes stock</p>
          <p className={`text-xl font-bold mt-0.5 ${lowStock.length > 0 ? 'text-orange-500' : ''}`}>{lowStock.length}</p>
        </div>
        <div className="border rounded-lg p-3 bg-card">
          <p className="text-xs text-muted-foreground">Valeur totale</p>
          <p className="text-xl font-bold mt-0.5">
            {totalValue > 0 ? new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(totalValue) : '—'}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par nom, N° pièce, fournisseur..."
          className="flex-1 h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
        />
        <SparePartFormDialog>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle pièce
          </Button>
        </SparePartFormDialog>
      </div>

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-50 border border-orange-200 text-orange-800 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            {lowStock.length} pièce{lowStock.length > 1 ? 's' : ''} en stock bas ou en rupture :{' '}
            {lowStock.map(p => p.name).join(', ')}
          </span>
        </div>
      )}

      {/* Empty state */}
      {parts.length === 0 && (
        <div className="text-center py-12 border rounded-lg bg-muted/30">
          <Package className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium">Aucune pièce de rechange</p>
          <p className="text-xs text-muted-foreground mt-1">Ajoutez vos pièces pour suivre votre stock.</p>
          <SparePartFormDialog>
            <Button size="sm" className="mt-4"><Plus className="h-4 w-4 mr-2" />Ajouter une pièce</Button>
          </SparePartFormDialog>
        </div>
      )}

      {/* Table */}
      {filtered.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Pièce</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden md:table-cell">Fournisseur</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden lg:table-cell">Emplacement</th>
                <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Qté</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden xl:table-cell">Coût unit.</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">État</th>
                <th className="w-28" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(part => (
                <tr key={part.id} className="bg-card hover:bg-muted/30 group">
                  <td className="px-4 py-3">
                    <div className="font-medium">{part.name}</div>
                    {part.partNumber && <div className="text-xs text-muted-foreground font-mono">{part.partNumber}</div>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs text-muted-foreground">
                    {part.supplier || '—'}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground">
                    {part.storageLocation || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <AdjustButton partId={part.id} delta={-1}>
                        <Minus className="h-3 w-3" />
                      </AdjustButton>
                      <span className="w-10 text-center font-medium tabular-nums">
                        {part.quantityOnHand % 1 === 0 ? part.quantityOnHand : part.quantityOnHand.toFixed(2)}
                        {part.unit && <span className="text-xs text-muted-foreground ml-0.5">{part.unit}</span>}
                      </span>
                      <AdjustButton partId={part.id} delta={1}>
                        <Plus className="h-3 w-3" />
                      </AdjustButton>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell text-xs text-muted-foreground">
                    {part.unitCost != null
                      ? new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(part.unitCost)
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StockBadge qty={part.quantityOnHand} min={part.quantityMin} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="hidden group-hover:flex items-center gap-0.5 justify-end">
                      <SparePartFormDialog part={part}>
                        <Button variant="ghost" size="icon-sm"><Pencil className="h-3.5 w-3.5" /></Button>
                      </SparePartFormDialog>
                      <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(part)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {search && filtered.length === 0 && parts.length > 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">Aucun résultat pour « {search} »</p>
      )}
    </div>
  )
}

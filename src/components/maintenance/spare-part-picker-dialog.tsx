'use client'

import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

type SparePartFull = {
  id: string
  name: string
  partNumber: string | null
  description: string | null
  quantityOnHand: number
  supplier: string | null
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  spareParts: SparePartFull[]
  onSelect: (id: string, name: string) => void
}

export function SparePartPickerDialog({ open, onOpenChange, spareParts, onSelect }: Props) {
  const [search, setSearch] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('')

  // Liste de fournisseurs uniques pour le filtre
  const suppliers = useMemo(() => {
    const s = new Set(spareParts.map(p => p.supplier).filter(Boolean) as string[])
    return Array.from(s).sort()
  }, [spareParts])

  // Filtrage client-side (suffisant pour ~5000 items)
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return spareParts.filter(p => {
      if (supplierFilter && p.supplier !== supplierFilter) return false
      if (!q) return true
      return (
        p.name.toLowerCase().includes(q) ||
        (p.partNumber?.toLowerCase().includes(q) ?? false) ||
        (p.description?.toLowerCase().includes(q) ?? false)
      )
    })
  }, [spareParts, search, supplierFilter])

  function handleSelect(p: SparePartFull) {
    onSelect(p.id, p.name)
    onOpenChange(false)
    setSearch('')
    setSupplierFilter('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-4 pt-4 pb-3 border-b">
          <DialogTitle>Choisir une pièce inventaire</DialogTitle>
        </DialogHeader>

        {/* Barre de recherche + filtre fournisseur */}
        <div className="flex gap-2 px-4 py-3 border-b">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Rechercher par référence, nom, description..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          {suppliers.length > 0 && (
            <select
              value={supplierFilter}
              onChange={e => setSupplierFilter(e.target.value)}
              className="h-9 rounded-lg border border-input bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 min-w-[140px]"
            >
              <option value="">Tous les fournisseurs</option>
              {suppliers.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}
        </div>

        {/* Résultats */}
        <div className="overflow-y-auto flex-1">
          {/* En-têtes de colonnes */}
          <div className="grid grid-cols-[1fr_2fr_1fr_auto] gap-3 px-4 py-2 border-b bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <span>Référence</span>
            <span>Nom / Description</span>
            <span>Stock</span>
            <span className="w-16" />
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucune pièce trouvée
            </p>
          ) : (
            <ul className="divide-y">
              {filtered.map(p => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(p)}
                    className="w-full grid grid-cols-[1fr_2fr_1fr_auto] gap-3 px-4 py-2.5 text-left hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-xs font-mono text-muted-foreground truncate">
                      {p.partNumber ?? '—'}
                    </span>
                    <span className="min-w-0">
                      <span className="text-sm font-medium block truncate">{p.name}</span>
                      {p.description && (
                        <span className="text-xs text-muted-foreground truncate block">{p.description}</span>
                      )}
                    </span>
                    <span className="text-sm tabular-nums text-right">{p.quantityOnHand}</span>
                    <span className="text-xs text-primary font-medium w-16 text-right">Choisir</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Pied : compteur + fermeture */}
        <div className="px-4 py-2.5 border-t bg-muted/30 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {filtered.length} pièce{filtered.length !== 1 ? 's' : ''}
            {filtered.length !== spareParts.length ? ` sur ${spareParts.length}` : ''}
          </span>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Fermer
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

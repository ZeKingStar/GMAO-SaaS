'use client'

import React, { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { createSparePart, updateSparePart } from '@/actions/inventory'

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

type Props = {
  part?: SparePart
  children: React.ReactElement
}

const UNITS = ['unité', 'paire', 'boîte', 'rouleau', 'm', 'cm', 'kg', 'g', 'L', 'mL']

export function SparePartFormDialog({ part, children }: Props) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState({
    name: part?.name ?? '',
    partNumber: part?.partNumber ?? '',
    description: part?.description ?? '',
    unit: part?.unit ?? '',
    quantityOnHand: part?.quantityOnHand?.toString() ?? '0',
    quantityMin: part?.quantityMin?.toString() ?? '',
    unitCost: part?.unitCost?.toString() ?? '',
    supplier: part?.supplier ?? '',
    storageLocation: part?.storageLocation ?? '',
  })

  function handleOpen(isOpen: boolean) {
    if (isOpen && !part) {
      setForm({ name: '', partNumber: '', description: '', unit: '', quantityOnHand: '0', quantityMin: '', unitCost: '', supplier: '', storageLocation: '' })
    }
    setOpen(isOpen)
  }

  const trigger = React.cloneElement(
    children as React.ReactElement<React.HTMLAttributes<HTMLElement>>,
    { onClick: () => handleOpen(true) }
  )

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Le nom est requis'); return }

    startTransition(async () => {
      try {
        const data = {
          name: form.name,
          partNumber: form.partNumber || undefined,
          description: form.description || undefined,
          unit: form.unit || undefined,
          quantityOnHand: form.quantityOnHand ? parseFloat(form.quantityOnHand) : 0,
          quantityMin: form.quantityMin ? parseFloat(form.quantityMin) : undefined,
          unitCost: form.unitCost ? parseFloat(form.unitCost) : undefined,
          supplier: form.supplier || undefined,
          storageLocation: form.storageLocation || undefined,
        }
        if (part) {
          await updateSparePart(part.id, { ...data, quantityMin: data.quantityMin ?? null, unitCost: data.unitCost ?? null })
          toast.success('Pièce mise à jour')
        } else {
          await createSparePart(data)
          toast.success('Pièce ajoutée')
        }
        setOpen(false)
      } catch {
        toast.error('Une erreur est survenue')
      }
    })
  }

  const SELECT_CLASS = 'w-full h-9 rounded-lg border border-input bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50'

  return (
    <>
      {trigger}
      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{part ? 'Modifier la pièce' : 'Nouvelle pièce de rechange'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sp-name">Nom *</Label>
              <Input id="sp-name" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ex : Filtre à huile 10L" autoFocus />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="sp-pn">N° de pièce</Label>
                <Input id="sp-pn" value={form.partNumber} onChange={e => set('partNumber', e.target.value)} placeholder="Ex : FH-1023" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sp-unit">Unité</Label>
                <select id="sp-unit" value={form.unit} onChange={e => set('unit', e.target.value)} className={SELECT_CLASS}>
                  <option value="">— Libre —</option>
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="sp-qty">Qté en stock</Label>
                <Input id="sp-qty" type="number" min={0} step="0.01" value={form.quantityOnHand} onChange={e => set('quantityOnHand', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sp-min">Qté minimum</Label>
                <Input id="sp-min" type="number" min={0} step="0.01" value={form.quantityMin} onChange={e => set('quantityMin', e.target.value)} placeholder="Alerte" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sp-cost">Coût unitaire ($)</Label>
                <Input id="sp-cost" type="number" min={0} step="0.01" value={form.unitCost} onChange={e => set('unitCost', e.target.value)} placeholder="0.00" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="sp-supplier">Fournisseur</Label>
                <Input id="sp-supplier" value={form.supplier} onChange={e => set('supplier', e.target.value)} placeholder="Ex : Grainger" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sp-loc">Emplacement</Label>
                <Input id="sp-loc" value={form.storageLocation} onChange={e => set('storageLocation', e.target.value)} placeholder="Ex : Étagère A-3" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sp-desc">Description</Label>
              <textarea
                id="sp-desc"
                value={form.description}
                onChange={e => set('description', e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring/50"
                placeholder="Notes, spécifications..."
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={pending}>{pending ? 'Enregistrement...' : part ? 'Mettre à jour' : 'Ajouter'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

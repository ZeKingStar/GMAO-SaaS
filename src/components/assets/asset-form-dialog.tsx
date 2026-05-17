'use client'

import React, { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { createAsset, updateAsset } from '@/actions/assets'

type Category = { id: string; name: string; icon: string | null }
type Site = { id: string; name: string; locations: { id: string; name: string; parentId: string | null }[] }
type Asset = {
  id: string; name: string; description: string | null; serialNumber: string | null
  model: string | null; manufacturer: string | null; categoryId: string | null
  siteId: string | null; locationId: string | null; parentId: string | null
  isActive: boolean
}

type Props = {
  asset?: Asset
  categories: Category[]
  sites: Site[]
  parentId?: string
  children: React.ReactElement
}

export function AssetFormDialog({ asset, categories, sites, parentId, children }: Props) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState({
    name: asset?.name ?? '',
    description: asset?.description ?? '',
    serialNumber: asset?.serialNumber ?? '',
    model: asset?.model ?? '',
    manufacturer: asset?.manufacturer ?? '',
    categoryId: asset?.categoryId ?? '',
    siteId: asset?.siteId ?? '',
    locationId: asset?.locationId ?? '',
  })

  function handleOpen(isOpen: boolean) {
    if (isOpen) setForm({
      name: asset?.name ?? '',
      description: asset?.description ?? '',
      serialNumber: asset?.serialNumber ?? '',
      model: asset?.model ?? '',
      manufacturer: asset?.manufacturer ?? '',
      categoryId: asset?.categoryId ?? '',
      siteId: asset?.siteId ?? '',
      locationId: asset?.locationId ?? '',
    })
    setOpen(isOpen)
  }

  const trigger = React.cloneElement(
    children as React.ReactElement<React.HTMLAttributes<HTMLElement>>,
    { onClick: () => handleOpen(true) }
  )

  const availableLocations = form.siteId
    ? sites.find(s => s.id === form.siteId)?.locations ?? []
    : []

  function set(field: string, value: string) {
    setForm(f => {
      const next = { ...f, [field]: value }
      if (field === 'siteId') next.locationId = ''
      return next
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Le nom est requis'); return }
    startTransition(async () => {
      try {
        const data = {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          serialNumber: form.serialNumber.trim() || undefined,
          model: form.model.trim() || undefined,
          manufacturer: form.manufacturer.trim() || undefined,
          categoryId: form.categoryId || undefined,
          siteId: form.siteId || undefined,
          locationId: form.locationId || undefined,
          parentId: parentId || asset?.parentId || undefined,
        }
        asset ? await updateAsset(asset.id, data) : await createAsset(data)
        toast.success(asset ? 'Actif mis à jour' : 'Actif créé')
        setOpen(false)
      } catch { toast.error("Une erreur s'est produite") }
    })
  }

  return (
    <>
      {trigger}
      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{asset ? 'Modifier l\'actif' : parentId ? 'Ajouter un sous-composant' : 'Nouvel actif'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="a-name">Nom *</Label>
                <Input id="a-name" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ex : Compresseur Atlas #1" autoFocus />
              </div>
              <div className="space-y-2">
                <Label htmlFor="a-serial">Numéro de série</Label>
                <Input id="a-serial" value={form.serialNumber} onChange={e => set('serialNumber', e.target.value)} placeholder="SN-12345" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="a-model">Modèle</Label>
                <Input id="a-model" value={form.model} onChange={e => set('model', e.target.value)} placeholder="Atlas Copco GA22" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="a-manuf">Fabricant</Label>
                <Input id="a-manuf" value={form.manufacturer} onChange={e => set('manufacturer', e.target.value)} placeholder="Atlas Copco" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="a-cat">Catégorie</Label>
                <select
                  id="a-cat"
                  value={form.categoryId}
                  onChange={e => set('categoryId', e.target.value)}
                  className="w-full h-8 rounded-lg border border-input bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
                >
                  <option value="">— Aucune —</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.icon ? `${c.icon} ` : ''}{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="a-site">Site</Label>
                <select
                  id="a-site"
                  value={form.siteId}
                  onChange={e => set('siteId', e.target.value)}
                  className="w-full h-8 rounded-lg border border-input bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
                >
                  <option value="">— Aucun —</option>
                  {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              {form.siteId && (
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="a-loc">Localisation</Label>
                  <select
                    id="a-loc"
                    value={form.locationId}
                    onChange={e => set('locationId', e.target.value)}
                    className="w-full h-8 rounded-lg border border-input bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
                  >
                    <option value="">— Aucune —</option>
                    {availableLocations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
              )}
              <div className="col-span-2 space-y-2">
                <Label htmlFor="a-desc">Description</Label>
                <Input id="a-desc" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Description optionnelle" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={pending} className="w-full sm:w-auto">
                {pending ? 'Enregistrement...' : asset ? 'Mettre à jour' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

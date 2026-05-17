'use client'

import React, { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { createSite, updateSite } from '@/actions/sites'

type Site = {
  id: string
  name: string
  address: string | null
  city: string | null
  province: string | null
  postalCode: string | null
}

type Props = {
  site?: Site
  children: React.ReactElement
}

export function SiteFormDialog({ site, children }: Props) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState({
    name: site?.name ?? '',
    address: site?.address ?? '',
    city: site?.city ?? '',
    province: site?.province ?? '',
    postalCode: site?.postalCode ?? '',
  })

  function handleOpenChange(isOpen: boolean) {
    if (isOpen) {
      setForm({
        name: site?.name ?? '',
        address: site?.address ?? '',
        city: site?.city ?? '',
        province: site?.province ?? '',
        postalCode: site?.postalCode ?? '',
      })
    }
    setOpen(isOpen)
  }

  const trigger = React.cloneElement(
    children as React.ReactElement<React.HTMLAttributes<HTMLElement>>,
    { onClick: () => handleOpenChange(true) }
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Le nom est requis')
      return
    }
    startTransition(async () => {
      try {
        const data = {
          name: form.name.trim(),
          address: form.address.trim() || undefined,
          city: form.city.trim() || undefined,
          province: form.province.trim() || undefined,
          postalCode: form.postalCode.trim() || undefined,
        }
        if (site) {
          await updateSite(site.id, data)
          toast.success('Site mis à jour')
        } else {
          await createSite(data)
          toast.success('Site créé')
        }
        setOpen(false)
      } catch {
        toast.error("Une erreur s'est produite")
      }
    })
  }

  return (
    <>
      {trigger}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{site ? 'Modifier le site' : 'Nouveau site'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="site-name">Nom *</Label>
              <Input
                id="site-name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ex : Usine principale"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="site-address">Adresse</Label>
              <Input
                id="site-address"
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                placeholder="123 rue de la Fabrique"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="site-city">Ville</Label>
                <Input
                  id="site-city"
                  value={form.city}
                  onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  placeholder="Montréal"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="site-postal">Code postal</Label>
                <Input
                  id="site-postal"
                  value={form.postalCode}
                  onChange={e => setForm(f => ({ ...f, postalCode: e.target.value }))}
                  placeholder="H1A 1A1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="site-province">Province</Label>
              <Input
                id="site-province"
                value={form.province}
                onChange={e => setForm(f => ({ ...f, province: e.target.value }))}
                placeholder="Québec"
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={pending} className="w-full sm:w-auto">
                {pending ? 'Enregistrement...' : site ? 'Mettre à jour' : 'Créer le site'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

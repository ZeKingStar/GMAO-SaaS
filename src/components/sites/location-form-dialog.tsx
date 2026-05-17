'use client'

import React, { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { createLocation, updateLocation } from '@/actions/sites'

type Location = {
  id: string
  name: string
  parentId: string | null
}

type Props = {
  siteId: string
  parentId?: string
  parentName?: string
  location?: Location
  children: React.ReactElement
}

export function LocationFormDialog({ siteId, parentId, parentName, location, children }: Props) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState(location?.name ?? '')

  function handleOpenChange(isOpen: boolean) {
    if (isOpen) setName(location?.name ?? '')
    setOpen(isOpen)
  }

  const trigger = React.cloneElement(
    children as React.ReactElement<React.HTMLAttributes<HTMLElement>>,
    { onClick: () => handleOpenChange(true) }
  )

  const isEdit = !!location
  const title = isEdit
    ? 'Modifier la localisation'
    : parentName
      ? `Ajouter sous "${parentName}"`
      : 'Nouvelle localisation'

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Le nom est requis')
      return
    }
    startTransition(async () => {
      try {
        if (isEdit) {
          await updateLocation(location.id, { name: name.trim() })
          toast.success('Localisation mise à jour')
        } else {
          await createLocation({ siteId, parentId, name: name.trim() })
          toast.success('Localisation créée')
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
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {parentName && !isEdit && (
              <DialogDescription>
                Sous-localisation de : {parentName}
              </DialogDescription>
            )}
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="loc-name">Nom *</Label>
              <Input
                id="loc-name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={parentName ? 'Ex : Local B-12' : 'Ex : Unité de production'}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={pending} className="w-full sm:w-auto">
                {pending ? 'Enregistrement...' : isEdit ? 'Mettre à jour' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

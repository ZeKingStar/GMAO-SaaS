'use client'

import React, { useState, useTransition } from 'react'
import { Plus, Pencil, Trash2, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { createCategory, updateCategory, deleteCategory } from '@/actions/categories'

type Category = { id: string; name: string; icon: string | null }

function CategoryFormDialog({
  category,
  children,
}: {
  category?: Category
  children: React.ReactElement
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState(category?.name ?? '')
  const [icon, setIcon] = useState(category?.icon ?? '')

  function handleOpen(isOpen: boolean) {
    if (isOpen) { setName(category?.name ?? ''); setIcon(category?.icon ?? '') }
    setOpen(isOpen)
  }

  const trigger = React.cloneElement(
    children as React.ReactElement<React.HTMLAttributes<HTMLElement>>,
    { onClick: () => handleOpen(true) }
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { toast.error('Le nom est requis'); return }
    startTransition(async () => {
      try {
        const data = { name: name.trim(), icon: icon.trim() || undefined }
        category ? await updateCategory(category.id, data) : await createCategory(data)
        toast.success(category ? 'Catégorie mise à jour' : 'Catégorie créée')
        setOpen(false)
      } catch { toast.error("Une erreur s'est produite") }
    })
  }

  return (
    <>
      {trigger}
      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{category ? 'Modifier' : 'Nouvelle catégorie'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Nom *</Label>
              <Input id="cat-name" value={name} onChange={e => setName(e.target.value)} placeholder="Ex : Électrique" autoFocus />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-icon">Icône (emoji)</Label>
              <Input id="cat-icon" value={icon} onChange={e => setIcon(e.target.value)} placeholder="Ex : ⚡" maxLength={4} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={pending} className="w-full sm:w-auto">
                {pending ? 'Enregistrement...' : category ? 'Mettre à jour' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function CategoryList({ categories }: { categories: Category[] }) {
  const [, startTransition] = useTransition()

  function handleDelete(cat: Category) {
    if (!confirm(`Supprimer la catégorie "${cat.name}" ?`)) return
    startTransition(async () => {
      try { await deleteCategory(cat.id); toast.success('Catégorie supprimée') }
      catch { toast.error("Erreur lors de la suppression") }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CategoryFormDialog>
          <Button size="sm"><Plus className="h-4 w-4 mr-2" />Nouvelle catégorie</Button>
        </CategoryFormDialog>
      </div>

      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Tag className="h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="font-semibold mb-1">Aucune catégorie</h3>
          <p className="text-sm text-muted-foreground mb-4">Créez des catégories pour organiser vos actifs.</p>
          <CategoryFormDialog>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" />Nouvelle catégorie</Button>
          </CategoryFormDialog>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center justify-between px-4 py-3 border rounded-lg bg-card group">
              <div className="flex items-center gap-3">
                <span className="text-xl w-7 text-center">{cat.icon || '📦'}</span>
                <span className="font-medium text-sm">{cat.name}</span>
              </div>
              <div className="hidden group-hover:flex items-center gap-0.5">
                <CategoryFormDialog category={cat}>
                  <Button variant="ghost" size="icon-sm"><Pencil className="h-3.5 w-3.5" /></Button>
                </CategoryFormDialog>
                <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(cat)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

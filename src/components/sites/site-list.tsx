'use client'

import { useTransition } from 'react'
import { Plus, Pencil, Trash2, MapPin, Building2, FolderPlus, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { toast } from 'sonner'
import { deleteSite, deleteLocation } from '@/actions/sites'
import { SiteFormDialog } from './site-form-dialog'
import { LocationFormDialog } from './location-form-dialog'

type Location = {
  id: string
  name: string
  siteId: string
  parentId: string | null
}

type LocationNode = Location & { children: LocationNode[] }

type Site = {
  id: string
  name: string
  address: string | null
  city: string | null
  province: string | null
  postalCode: string | null
  locations: Location[]
}

function buildTree(locations: Location[], parentId: string | null = null): LocationNode[] {
  return locations
    .filter(l => l.parentId === parentId)
    .map(l => ({ ...l, children: buildTree(locations, l.id) }))
}

function LocationNode({
  node,
  siteId,
  depth = 0,
}: {
  node: LocationNode
  siteId: string
  depth?: number
}) {
  const [, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm(`Supprimer "${node.name}" et toutes ses sous-localisations ?`)) return
    startTransition(async () => {
      try {
        await deleteLocation(node.id)
        toast.success('Localisation supprimée')
      } catch {
        toast.error("Erreur lors de la suppression")
      }
    })
  }

  return (
    <div>
      <div
        className="flex items-center justify-between py-1.5 rounded-md hover:bg-muted/50 group pr-1"
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        <div className="flex items-center gap-1.5 text-sm min-w-0">
          <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
          <span className="truncate">{node.name}</span>
        </div>
        <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
          <LocationFormDialog siteId={siteId} parentId={node.id} parentName={node.name}>
            <Button variant="ghost" size="icon-sm" title="Ajouter une sous-localisation">
              <Plus className="h-3 w-3" />
            </Button>
          </LocationFormDialog>
          <LocationFormDialog siteId={siteId} location={node}>
            <Button variant="ghost" size="icon-sm" title="Modifier">
              <Pencil className="h-3 w-3" />
            </Button>
          </LocationFormDialog>
          <Button variant="ghost" size="icon-sm" onClick={handleDelete} title="Supprimer">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      {node.children.map(child => (
        <LocationNode key={child.id} node={child} siteId={siteId} depth={depth + 1} />
      ))}
    </div>
  )
}

function SiteCard({ site }: { site: Site }) {
  const [, startTransition] = useTransition()
  const tree = buildTree(site.locations)
  const address = [site.address, site.city, site.province].filter(Boolean).join(', ')

  function handleDelete() {
    if (!confirm(`Supprimer "${site.name}" et toutes ses localisations ?`)) return
    startTransition(async () => {
      try {
        await deleteSite(site.id)
        toast.success('Site supprimé')
      } catch {
        toast.error("Erreur lors de la suppression")
      }
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{site.name}</h3>
            {address && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{address}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <LocationFormDialog siteId={site.id}>
              <Button variant="ghost" size="icon-sm" title="Ajouter une localisation">
                <FolderPlus className="h-4 w-4" />
              </Button>
            </LocationFormDialog>
            <SiteFormDialog site={site}>
              <Button variant="ghost" size="icon-sm" title="Modifier le site">
                <Pencil className="h-4 w-4" />
              </Button>
            </SiteFormDialog>
            <Button variant="ghost" size="icon-sm" onClick={handleDelete} title="Supprimer le site">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {tree.length > 0 ? (
          <div className="border-t pt-2">
            {tree.map(node => (
              <LocationNode key={node.id} node={node} siteId={site.id} />
            ))}
          </div>
        ) : (
          <LocationFormDialog siteId={site.id}>
            <button className="w-full text-center py-3 text-xs text-muted-foreground border border-dashed rounded-md hover:border-primary/50 hover:text-primary transition-colors">
              + Ajouter une localisation
            </button>
          </LocationFormDialog>
        )}
      </CardContent>
    </Card>
  )
}

export function SiteList({ sites }: { sites: Site[] }) {
  if (sites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <Building2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-1">Aucun site configuré</h3>
        <p className="text-muted-foreground text-sm mb-6 max-w-xs">
          Commencez par ajouter votre premier site pour organiser vos actifs par localisation.
        </p>
        <SiteFormDialog>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un site
          </Button>
        </SiteFormDialog>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <SiteFormDialog>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un site
          </Button>
        </SiteFormDialog>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sites.map(site => (
          <SiteCard key={site.id} site={site} />
        ))}
      </div>
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import {
  ChevronRight,
  ChevronDown,
  Building2,
  Folder,
  FolderOpen,
  Plus,
  Pencil,
  Trash2,
  FolderPlus,
  MapPin,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { deleteSite, deleteLocation } from '@/actions/sites'
import { SiteFormDialog } from './site-form-dialog'
import { LocationFormDialog } from './location-form-dialog'
import { cn } from '@/lib/utils'

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

function LocationRow({
  node,
  siteId,
  depth,
  expanded,
  onToggle,
}: {
  node: LocationNode
  siteId: string
  depth: number
  expanded: Set<string>
  onToggle: (id: string) => void
}) {
  const [, startTransition] = useTransition()
  const isExpanded = expanded.has(node.id)
  const hasChildren = node.children.length > 0

  function handleDelete() {
    if (!confirm(`Supprimer "${node.name}"${hasChildren ? ' et toutes ses sous-localisations' : ''} ?`)) return
    startTransition(async () => {
      try {
        await deleteLocation(node.id)
        toast.success('Localisation supprimée')
      } catch {
        toast.error('Erreur lors de la suppression')
      }
    })
  }

  return (
    <div>
      <div
        className="flex items-center justify-between py-1 rounded-md hover:bg-muted/60 group pr-1 cursor-pointer"
        style={{ paddingLeft: `${12 + depth * 20}px` }}
        onClick={() => hasChildren && onToggle(node.id)}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-4 shrink-0 flex items-center justify-center">
            {hasChildren ? (
              isExpanded
                ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <span className="w-3.5" />
            )}
          </span>
          {hasChildren
            ? isExpanded
              ? <FolderOpen className="h-4 w-4 text-amber-500 shrink-0" />
              : <Folder className="h-4 w-4 text-amber-500 shrink-0" />
            : <Folder className="h-4 w-4 text-muted-foreground/60 shrink-0" />
          }
          <span className="text-sm truncate">{node.name}</span>
        </div>

        <div
          className="hidden group-hover:flex items-center gap-0.5 shrink-0"
          onClick={e => e.stopPropagation()}
        >
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

      {isExpanded && node.children.map(child => (
        <LocationRow
          key={child.id}
          node={child}
          siteId={siteId}
          depth={depth + 1}
          expanded={expanded}
          onToggle={onToggle}
        />
      ))}
    </div>
  )
}

function SiteRow({
  site,
  expanded,
  onToggle,
  locationExpanded,
  onLocationToggle,
}: {
  site: Site
  expanded: Set<string>
  onToggle: (id: string) => void
  locationExpanded: Set<string>
  onLocationToggle: (id: string) => void
}) {
  const [, startTransition] = useTransition()
  const isExpanded = expanded.has(site.id)
  const tree = buildTree(site.locations)
  const address = [site.city, site.province].filter(Boolean).join(', ')

  function handleDelete() {
    if (!confirm(`Supprimer le site "${site.name}" et toutes ses localisations ?`)) return
    startTransition(async () => {
      try {
        await deleteSite(site.id)
        toast.success('Site supprimé')
      } catch {
        toast.error('Erreur lors de la suppression')
      }
    })
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div
        className="flex items-center justify-between px-3 py-2.5 bg-card hover:bg-muted/40 cursor-pointer group"
        onClick={() => onToggle(site.id)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-4 shrink-0 flex items-center justify-center">
            {isExpanded
              ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
              : <ChevronRight className="h-4 w-4 text-muted-foreground" />
            }
          </span>
          <Building2 className={cn('h-4 w-4 shrink-0', isExpanded ? 'text-primary' : 'text-muted-foreground')} />
          <div className="min-w-0">
            <span className="font-medium text-sm">{site.name}</span>
            {address && (
              <span className="ml-2 text-xs text-muted-foreground inline-flex items-center gap-0.5">
                <MapPin className="h-2.5 w-2.5" />{address}
              </span>
            )}
          </div>
          <span className="ml-2 text-xs text-muted-foreground shrink-0">
            {site.locations.length} localisation{site.locations.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div
          className="hidden group-hover:flex items-center gap-0.5 shrink-0"
          onClick={e => e.stopPropagation()}
        >
          <LocationFormDialog siteId={site.id}>
            <Button variant="ghost" size="icon-sm" title="Ajouter une localisation">
              <FolderPlus className="h-4 w-4" />
            </Button>
          </LocationFormDialog>
          <SiteFormDialog site={site}>
            <Button variant="ghost" size="icon-sm" title="Modifier">
              <Pencil className="h-4 w-4" />
            </Button>
          </SiteFormDialog>
          <Button variant="ghost" size="icon-sm" onClick={handleDelete} title="Supprimer">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t bg-background py-1">
          {tree.length === 0 ? (
            <div className="px-10 py-3">
              <LocationFormDialog siteId={site.id}>
                <button className="text-xs text-muted-foreground hover:text-primary transition-colors border border-dashed rounded px-3 py-1.5 w-full text-center">
                  + Ajouter une localisation
                </button>
              </LocationFormDialog>
            </div>
          ) : (
            tree.map(node => (
              <LocationRow
                key={node.id}
                node={node}
                siteId={site.id}
                depth={0}
                expanded={locationExpanded}
                onToggle={onLocationToggle}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

export function SiteTree({ sites }: { sites: Site[] }) {
  const [siteExpanded, setSiteExpanded] = useState<Set<string>>(new Set())
  const [locationExpanded, setLocationExpanded] = useState<Set<string>>(new Set())

  function toggleSite(id: string) {
    setSiteExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleLocation(id: string) {
    setLocationExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

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
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {sites.length} site{sites.length !== 1 ? 's' : ''} —{' '}
          cliquez sur un site pour déployer sa hiérarchie
        </p>
        <SiteFormDialog>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un site
          </Button>
        </SiteFormDialog>
      </div>

      <div className="space-y-2">
        {sites.map(site => (
          <SiteRow
            key={site.id}
            site={site}
            expanded={siteExpanded}
            onToggle={toggleSite}
            locationExpanded={locationExpanded}
            onLocationToggle={toggleLocation}
          />
        ))}
      </div>
    </div>
  )
}

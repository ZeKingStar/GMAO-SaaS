'use client'

import { useTransition } from 'react'
import { Plus, Pencil, Trash2, Cpu, MapPin, QrCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { deleteAsset } from '@/actions/assets'
import { AssetFormDialog } from './asset-form-dialog'
import { AssetQrDialog } from './asset-qr-dialog'
import { AssetMeterSection } from './asset-meter-section'

type Category = { id: string; name: string; icon: string | null }
type Location = { id: string; name: string; parentId: string | null }
type Site = { id: string; name: string; locations: Location[] }
type Meter = { id: string; name: string; unit: string; value: number }
type Asset = {
  id: string; name: string; description: string | null; serialNumber: string | null
  model: string | null; manufacturer: string | null; isActive: boolean; qrCode: string | null
  categoryId: string | null; siteId: string | null; locationId: string | null; parentId: string | null
  category: Category | null
  site: Site | null
  location: { id: string; name: string } | null
  meters: Meter[]
}

type Props = { assets: Asset[]; categories: Category[]; sites: Site[] }

export function AssetList({ assets, categories, sites }: Props) {
  const [, startTransition] = useTransition()

  function handleDelete(asset: Asset) {
    if (!confirm(`Supprimer l'actif "${asset.name}" ?`)) return
    startTransition(async () => {
      try { await deleteAsset(asset.id); toast.success('Actif supprimé') }
      catch { toast.error('Erreur lors de la suppression') }
    })
  }

  const topLevel = assets.filter(a => !a.parentId)

  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <Cpu className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-1">Aucun actif</h3>
        <p className="text-muted-foreground text-sm mb-6 max-w-xs">
          Ajoutez vos premiers équipements pour commencer à gérer votre maintenance.
        </p>
        <AssetFormDialog categories={categories} sites={sites}>
          <Button><Plus className="h-4 w-4 mr-2" />Nouvel actif</Button>
        </AssetFormDialog>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{topLevel.length} actif{topLevel.length !== 1 ? 's' : ''} principaux — {assets.length} au total</p>
        <AssetFormDialog categories={categories} sites={sites}>
          <Button size="sm"><Plus className="h-4 w-4 mr-2" />Nouvel actif</Button>
        </AssetFormDialog>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Nom</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden md:table-cell">Catégorie</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden lg:table-cell">Localisation</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden xl:table-cell">Série</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">État</th>
              <th className="w-24" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {assets.map(asset => (
              <tr key={asset.id} className="bg-card hover:bg-muted/30 group">
                <td className="px-4 py-3">
                  <div className="font-medium">{asset.name}</div>
                  {asset.model && <div className="text-xs text-muted-foreground">{asset.manufacturer ? `${asset.manufacturer} · ` : ''}{asset.model}</div>}
                  {asset.parentId && <div className="text-xs text-muted-foreground/60 italic">sous-composant</div>}
                  {asset.meters.length > 0 && (
                    <div className="mt-2">
                      <AssetMeterSection assetId={asset.id} meters={asset.meters} />
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  {asset.category ? (
                    <span className="flex items-center gap-1.5 text-xs">
                      <span>{asset.category.icon || '📦'}</span>
                      {asset.category.name}
                    </span>
                  ) : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  {asset.site ? (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {asset.site.name}{asset.location ? ` · ${asset.location.name}` : ''}
                    </span>
                  ) : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-4 py-3 hidden xl:table-cell text-xs text-muted-foreground">
                  {asset.serialNumber || '—'}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={asset.isActive ? 'default' : 'secondary'} className="text-xs">
                    {asset.isActive ? 'Actif' : 'Inactif'}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="hidden group-hover:flex items-center gap-0.5 justify-end">
                    <AssetQrDialog assetId={asset.id} assetName={asset.name} qrCode={asset.qrCode}>
                      <Button variant="ghost" size="icon-sm" title="QR Code">
                        <QrCode className="h-3.5 w-3.5" />
                      </Button>
                    </AssetQrDialog>
                    <AssetFormDialog asset={{ ...asset, meters: asset.meters }} categories={categories} sites={sites}>
                      <Button variant="ghost" size="icon-sm"><Pencil className="h-3.5 w-3.5" /></Button>
                    </AssetFormDialog>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(asset)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

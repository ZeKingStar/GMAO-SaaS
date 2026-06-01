import { getAuth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { MapPin, Tag, Cpu, ClipboardList, Calendar } from 'lucide-react'

export default async function ScanPage({
  params,
}: {
  params: Promise<{ qrCode: string }>
}) {
  const { orgId } = await getAuth()
  if (!orgId) redirect('/sign-in')

  const { qrCode } = await params

  const asset = await db.asset.findUnique({
    where: { qrCode },
    include: {
      category: { select: { name: true, icon: true } },
      site: { select: { name: true } },
      location: { select: { name: true } },
      _count: {
        select: { workOrders: true, maintenancePlans: true },
      },
    },
  })

  if (!asset) notFound()

  // Ensure user belongs to this asset's org
  if (asset.organizationId !== orgId) notFound()

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="mb-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Actif scanné</p>
        <h1 className="text-2xl font-bold mt-1">{asset.name}</h1>
      </div>

      {!asset.isActive && (
        <Badge variant="secondary" className="mb-4">Inactif</Badge>
      )}

      <div className="border rounded-lg divide-y bg-card mt-4">
        {asset.category && (
          <div className="flex items-center gap-3 px-4 py-3 text-sm">
            <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground w-28 shrink-0">Catégorie</span>
            <span>{asset.category.icon} {asset.category.name}</span>
          </div>
        )}

        {asset.site && (
          <div className="flex items-center gap-3 px-4 py-3 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground w-28 shrink-0">Site</span>
            <span>{asset.site.name}{asset.location ? ` › ${asset.location.name}` : ''}</span>
          </div>
        )}

        {asset.manufacturer && (
          <div className="flex items-center gap-3 px-4 py-3 text-sm">
            <Cpu className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground w-28 shrink-0">Fabricant</span>
            <span>{asset.manufacturer}{asset.model ? ` · ${asset.model}` : ''}</span>
          </div>
        )}

        {asset.serialNumber && (
          <div className="flex items-center gap-3 px-4 py-3 text-sm">
            <span className="h-4 w-4 text-muted-foreground shrink-0 text-center text-xs font-mono">#</span>
            <span className="text-muted-foreground w-28 shrink-0">N° de série</span>
            <span className="font-mono text-xs">{asset.serialNumber}</span>
          </div>
        )}

        <div className="flex items-center gap-3 px-4 py-3 text-sm">
          <ClipboardList className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground w-28 shrink-0">Bons de travail</span>
          <span>{asset._count.workOrders}</span>
        </div>

        <div className="flex items-center gap-3 px-4 py-3 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground w-28 shrink-0">Plans maintenance</span>
          <span>{asset._count.maintenancePlans}</span>
        </div>
      </div>

      {asset.description && (
        <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{asset.description}</p>
      )}

      <div className="flex flex-col gap-2 mt-6">
        <Link
          href={`/bons-de-travail?assetId=${asset.id}`}
          className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <ClipboardList className="h-4 w-4 mr-2" />
          Créer un bon de travail
        </Link>
        <Link
          href="/actifs"
          className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
        >
          Voir tous les actifs
        </Link>
      </div>
    </div>
  )
}

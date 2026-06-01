import type { Metadata } from 'next'
import { getAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { SiteTree } from '@/components/sites/site-tree'

export const metadata: Metadata = { title: 'Sites & Localisations' }

export default async function SitesPage() {
  const { orgId } = await getAuth()
  if (!orgId) return null

  const sites = await db.site.findMany({
    where: { organizationId: orgId },
    include: { locations: { orderBy: { name: 'asc' } } },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Sites & Localisations</h2>
        <p className="text-muted-foreground text-sm">
          Gérez vos sites et leur hiérarchie de localisations
        </p>
      </div>
      <SiteTree sites={sites} />
    </div>
  )
}

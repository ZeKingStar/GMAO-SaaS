import type { Metadata } from 'next'
import { getAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { AssetList } from '@/components/assets/asset-list'

export const metadata: Metadata = { title: 'Actifs' }

export default async function ActifsPage() {
  const { orgId } = await getAuth()
  if (!orgId) return null



  const [assets, categories, sites] = await Promise.all([
    db.asset.findMany({
      where: { organizationId: orgId },
      include: {
        category: true,
        site: { include: { locations: true } },
        location: true,
        meters: true,
      },
      orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
    }),
    db.assetCategory.findMany({ where: { organizationId: orgId }, orderBy: { name: 'asc' } }),
    db.site.findMany({
      where: { organizationId: orgId },
      include: { locations: { orderBy: { name: 'asc' } } },
      orderBy: { name: 'asc' },
    }),
  ])

  return <AssetList assets={assets} categories={categories} sites={sites} />
}

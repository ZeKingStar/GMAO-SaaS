import type { Metadata } from 'next'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { AssetList } from '@/components/assets/asset-list'

export const metadata: Metadata = { title: 'Actifs' }

export default async function ActifsPage() {
  const { orgId } = await auth()
  if (!orgId) return null

  const org = await db.organization.findUnique({ where: { clerkId: orgId }, select: { id: true } })
  if (!org) return null

  const [assets, categories, sites] = await Promise.all([
    db.asset.findMany({
      where: { organizationId: org.id },
      include: {
        category: true,
        site: { include: { locations: true } },
        location: true,
      },
      orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
    }),
    db.assetCategory.findMany({ where: { organizationId: org.id }, orderBy: { name: 'asc' } }),
    db.site.findMany({
      where: { organizationId: org.id },
      include: { locations: { orderBy: { name: 'asc' } } },
      orderBy: { name: 'asc' },
    }),
  ])

  return <AssetList assets={assets} categories={categories} sites={sites} />
}

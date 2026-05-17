import type { Metadata } from 'next'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { CategoryList } from '@/components/categories/category-list'

export const metadata: Metadata = { title: 'Catégories d\'actifs' }

export default async function CategoriesPage() {
  const { orgId } = await auth()
  if (!orgId) return null

  const org = await db.organization.findUnique({ where: { clerkId: orgId }, select: { id: true } })
  if (!org) return null

  const categories = await db.assetCategory.findMany({
    where: { organizationId: org.id },
    orderBy: { name: 'asc' },
  })

  return <CategoryList categories={categories} />
}

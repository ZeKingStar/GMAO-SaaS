import type { Metadata } from 'next'
import { getAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { CategoryList } from '@/components/categories/category-list'

export const metadata: Metadata = { title: 'Catégories d\'actifs' }

export default async function CategoriesPage() {
  const { orgId } = await getAuth()
  if (!orgId) return null



  const categories = await db.assetCategory.findMany({
    where: { organizationId: orgId },
    orderBy: { name: 'asc' },
  })

  return <CategoryList categories={categories} />
}

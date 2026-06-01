import { getAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { SparePartList } from '@/components/inventory/spare-part-list'

export default async function InventairePage() {
  const { orgId } = await getAuth()
  if (!orgId) redirect('/sign-in')

  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: { id: true },
  })
  if (!org) redirect('/onboarding')

  const parts = await db.sparePart.findMany({
    where: { organizationId: org.id },
    orderBy: [{ name: 'asc' }],
  })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Inventaire</h1>
        <p className="text-muted-foreground text-sm mt-1">Gérez vos pièces de rechange et consommables</p>
      </div>
      <SparePartList parts={parts} />
    </div>
  )
}

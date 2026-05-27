import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { MaintenancePlanList } from '@/components/maintenance/maintenance-plan-list'

export default async function MaintenancePage() {
  const { orgId } = await auth()
  if (!orgId) redirect('/sign-in')

  const org = await db.organization.findUnique({
    where: { clerkId: orgId },
    select: { id: true },
  })
  if (!org) redirect('/onboarding')

  const [plans, assets, categories, spareParts] = await Promise.all([
    db.maintenancePlan.findMany({
      where: { organizationId: org.id },
      include: {
        asset: { select: { id: true, name: true } },
        tasks: { orderBy: { order: 'asc' } },
        planParts: {
          include: { sparePart: { select: { id: true, name: true, partNumber: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: [{ isActive: 'desc' }, { nextDueAt: 'asc' }, { createdAt: 'desc' }],
    }),
    db.asset.findMany({
      where: { organizationId: org.id },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    db.assetCategory.findMany({
      where: { organizationId: org.id },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    db.sparePart.findMany({
      where: { organizationId: org.id },
      select: { id: true, name: true, partNumber: true, description: true, quantityOnHand: true, supplier: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Maintenance préventive</h1>
        <p className="text-muted-foreground text-sm mt-1">Planifiez vos interventions récurrentes par actif ou catégorie</p>
      </div>
      <MaintenancePlanList plans={plans} assets={assets} categories={categories} spareParts={spareParts} />
    </div>
  )
}

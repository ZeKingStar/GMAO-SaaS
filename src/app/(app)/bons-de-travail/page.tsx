import { getAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { WorkOrderList } from '@/components/work-orders/work-order-list'

export default async function WorkOrdersPage() {
  const { orgId } = await getAuth()
  if (!orgId) redirect('/sign-in')

  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: { id: true },
  })
  if (!org) redirect('/onboarding')

  const [workOrders, sites, assets, members] = await Promise.all([
    db.workOrder.findMany({
      where: { organizationId: org.id },
      include: {
        asset: { select: { id: true, name: true } },
        site: { select: { id: true, name: true } },
        assignees: {
          include: { membership: { select: { firstName: true, lastName: true } } },
        },
        _count: { select: { comments: true } },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    }),
    db.site.findMany({ where: { organizationId: org.id }, select: { id: true, name: true } }),
    db.asset.findMany({ where: { organizationId: org.id }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    db.membership.findMany({
      where: { organizationId: org.id },
      select: { id: true, firstName: true, lastName: true, email: true },
      orderBy: { firstName: 'asc' },
    }),
  ])

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Bons de travail</h1>
        <p className="text-muted-foreground text-sm mt-1">Gérez vos interventions correctives et préventives</p>
      </div>
      <WorkOrderList workOrders={workOrders} sites={sites} assets={assets} members={members} />
    </div>
  )
}

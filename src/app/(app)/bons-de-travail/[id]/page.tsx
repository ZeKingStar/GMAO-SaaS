import { getAuth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { parseClosureRequirements } from '@/lib/closure-requirements'
import { WorkOrderDetail } from '@/components/work-orders/work-order-detail'

export default async function WorkOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { orgId, userId } = await getAuth()
  if (!orgId || !userId) redirect('/sign-in')

  const [workOrder, allSites, allAssets, allMembers, currentMembership, spareParts, orgConfig] = await Promise.all([
    db.workOrder.findFirst({
      where: { id, organizationId: orgId },
      include: {
        asset: { select: { id: true, name: true, meters: { select: { id: true, name: true, unit: true, value: true } } } },
        site: { select: { id: true, name: true } },
        assignees: {
          include: {
            membership: { select: { id: true, firstName: true, lastName: true, email: true, hourlyRate: true } },
          },
        },
        comments: {
          include: {
            membership: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        timeLogs: {
          include: {
            membership: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { startedAt: 'asc' },
        },
        parts: {
          include: {
            sparePart: {
              select: { id: true, name: true, partNumber: true, quantityOnHand: true, unitCost: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        checklistItems: {
          select: { id: true, order: true, description: true, checked: true, measureValue: true },
          orderBy: { order: 'asc' },
        },
      },
    }),
    db.site.findMany({ where: { organizationId: orgId }, select: { id: true, name: true } }),
    db.asset.findMany({ where: { organizationId: orgId }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    db.membership.findMany({
      where: { organizationId: orgId },
      select: { id: true, firstName: true, lastName: true, email: true },
      orderBy: { firstName: 'asc' },
    }),
    db.membership.findFirst({
      where: { organizationId: orgId, userId },
      select: { id: true, role: true },
    }),
    db.sparePart.findMany({
      where: { organizationId: orgId },
      select: { id: true, name: true, partNumber: true, quantityOnHand: true, unitCost: true },
      orderBy: { name: 'asc' },
    }),
    db.organization.findUnique({
      where: { id: orgId },
      select: { closureRequirements: true },
    }),
  ])

  if (!workOrder) notFound()

  return (
    <div className="p-6">
      <WorkOrderDetail
        workOrder={workOrder}
        allMembers={allMembers}
        allSites={allSites}
        allAssets={allAssets}
        spareParts={spareParts}
        currentMembershipId={currentMembership?.id ?? ''}
        currentRole={currentMembership?.role ?? 'viewer'}
        closureRequirements={parseClosureRequirements(orgConfig?.closureRequirements)}
      />
    </div>
  )
}

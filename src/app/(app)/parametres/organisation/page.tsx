import { getAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { OrgSettingsForm } from '@/components/settings/org-settings-form'
import { TeamTable } from '@/components/settings/team-table'
import { BillingSection } from '@/components/settings/billing-section'
import { InviteDialog } from '@/components/settings/invite-dialog'
import { PendingInvitationsSection } from '@/components/settings/pending-invitations-section'
import { listPendingInvitations } from '@/actions/settings'
import { Building2, Users, CreditCard } from 'lucide-react'
import type { MemberRole } from '@/generated/prisma/enums'

export default async function ParametresPage() {
  const { orgId, userId } = await getAuth()
  if (!orgId || !userId) redirect('/sign-in')

  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: { id: true, name: true, industry: true, size: true },
  })
  if (!org) redirect('/onboarding')

  const [members, subscription] = await Promise.all([
    db.membership.findMany({
      where: { organizationId: org.id },
      orderBy: [{ role: 'asc' }, { firstName: 'asc' }],
    }),
    db.subscription.findUnique({
      where: { organizationId: org.id },
      select: { plan: true, status: true, trialEndsAt: true, currentPeriodEnd: true },
    }),
  ])

  const currentMembership = members.find(m => m.clerkUserId === userId)
  const canManageTeam = !!currentMembership && ['admin', 'manager'].includes(currentMembership.role)

  const pendingInvitations = canManageTeam
    ? (await listPendingInvitations()).map(inv => ({
        id: inv.id,
        emailAddress: inv.emailAddress,
        role: (inv.role.startsWith('org:') ? inv.role.slice(4) : inv.role) as MemberRole,
        createdAt: inv.createdAt,
      }))
    : []

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground text-sm mt-1">Gérez votre organisation et votre équipe</p>
      </div>

      {/* Organisation */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Organisation</h2>
        </div>
        <div className="border rounded-lg p-5 bg-card">
          <OrgSettingsForm org={org} />
        </div>
      </section>

      {/* Abonnement */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Abonnement</h2>
        </div>
        <div className="border rounded-lg p-5 bg-card">
          <BillingSection subscription={subscription} />
        </div>
      </section>

      {/* Équipe */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Équipe</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {members.length} membre{members.length !== 1 ? 's' : ''}
            </span>
            {canManageTeam && (
              <InviteDialog currentRole={currentMembership!.role as MemberRole} />
            )}
          </div>
        </div>
        <TeamTable
          members={members}
          currentMembershipId={currentMembership?.id ?? ''}
          currentRole={currentMembership?.role ?? 'viewer'}
        />
        <PendingInvitationsSection invitations={pendingInvitations} />
      </section>
    </div>
  )
}

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { OrgSettingsForm } from '@/components/settings/org-settings-form'
import { TeamTable } from '@/components/settings/team-table'
import { BillingSection } from '@/components/settings/billing-section'
import { ApiKeysSection } from '@/components/settings/api-keys-section'
import { PortalSitesSection, type PortalSiteRow } from '@/components/settings/portal-sites-section'
import { listApiKeys } from '@/actions/api-keys'
import { ClosureRequirementsSection } from '@/components/settings/closure-requirements-section'
import { parseClosureRequirements } from '@/lib/closure-requirements'
import { Building2, Users, CreditCard, KeyRound, Globe, ClipboardCheck } from 'lucide-react'

export default async function ParametresPage() {
  const { orgId, userId } = await auth()
  if (!orgId || !userId) redirect('/sign-in')

  const org = await db.organization.findUnique({
    where: { clerkId: orgId },
    select: { id: true, name: true, industry: true, size: true, closureRequirements: true },
  })
  if (!org) redirect('/onboarding')

  const [members, subscription] = await Promise.all([
    db.membership.findMany({
      where: { organizationId: org.id },
      orderBy: [{ role: 'asc' }, { firstName: 'asc' }],
    }),
    db.subscription.findUnique({
      where: { organizationId: org.id },
      select: { plan: true, status: true, trialEndsAt: true, currentPeriodEnd: true, stripeCustomerId: true },
    }),
  ])

  const currentMembership = members.find(m => m.clerkUserId === userId)
  const closureReq = parseClosureRequirements(org.closureRequirements)

  // API Keys section — admin/manager role + Croissance or Entreprise plan
  const isActivePlan = subscription && ['active', 'trialing'].includes(subscription.status)
  const hasApiAccess = isActivePlan && ['growth', 'enterprise'].includes(subscription.plan)
  const canManageApiKeys =
    hasApiAccess && currentMembership && ['admin', 'manager'].includes(currentMembership.role)
  const apiKeys = canManageApiKeys ? await listApiKeys() : []

  // Portal section — admin/manager role only (no plan gating)
  const canManagePortals =
    currentMembership && ['admin', 'manager'].includes(currentMembership.role)

  const portalSites: PortalSiteRow[] = canManagePortals
    ? await db.site.findMany({
        where: { organizationId: org.id },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          portalToken: true,
          portalEnabled: true,
        },
      })
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
          <BillingSection subscription={subscription} hasStripeCustomer={!!subscription?.stripeCustomerId} />
        </div>
      </section>

      {/* Équipe */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Équipe</h2>
          </div>
          <span className="text-xs text-muted-foreground">
            {members.length} membre{members.length !== 1 ? 's' : ''}
          </span>
        </div>
        <TeamTable
          members={members}
          currentMembershipId={currentMembership?.id ?? ''}
          currentRole={currentMembership?.role ?? 'viewer'}
        />
        <p className="text-xs text-muted-foreground">
          Pour inviter des membres, utilisez le tableau de bord Clerk de votre organisation.
        </p>
      </section>

      {/* Exigences de clôture — admin/manager only */}
      {currentMembership && ['admin', 'manager'].includes(currentMembership.role) && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Exigences de clôture des bons de travail</h2>
          </div>
          <div className="border rounded-lg p-5 bg-card">
            <ClosureRequirementsSection initial={closureReq} />
          </div>
        </section>
      )}

      {/* Clés API — admin/manager only */}
      {canManageApiKeys && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">API</h2>
          </div>
          <ApiKeysSection initialKeys={apiKeys} />
        </section>
      )}

      {/* Portails publics — admin/manager only */}
      {canManagePortals && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Portails publics</h2>
          </div>
          <PortalSitesSection initialSites={portalSites} />
        </section>
      )}
    </div>
  )
}

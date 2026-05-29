import { auth, currentUser } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import type { MemberRole, SubscriptionPlan } from "@/generated/prisma/enums"

// Gate: ENABLE_GOD_MODE=true in .env.local + never active in production
// REMOVE BEFORE PUBLIC LAUNCH — tracked in .planning/todos/pending/god-mode-removal.md
const GOD_MODE = process.env.ENABLE_GOD_MODE === 'true' && process.env.NODE_ENV !== 'production'

export function isGodMode() {
  return GOD_MODE
}

export async function getOrganizationMembership() {
  const { userId, orgId } = await auth()
  if (!userId || !orgId) return null

  return db.membership.findFirst({
    where: { clerkUserId: userId, organization: { clerkId: orgId } },
    include: { organization: { include: { subscription: true } } },
  })
}

export async function requireOrgAccess() {
  const membership = await getOrganizationMembership()
  if (!membership) throw new Error("Unauthorized")
  return membership
}

export async function requireRole(roles: MemberRole[]) {
  const membership = await requireOrgAccess()
  if (!GOD_MODE && !roles.includes(membership.role)) throw new Error("Forbidden")
  return membership
}

const ACTIVE_STATUSES = ['active', 'trialing'] as const

export async function requirePlan(plans: SubscriptionPlan[]) {
  const membership = await getOrganizationMembership()
  if (!membership) throw new Error('Unauthorized')

  const sub = membership.organization.subscription
  // null subscription OR non-active status → effective plan is 'starter'
  const effectivePlan: SubscriptionPlan =
    sub && ACTIVE_STATUSES.includes(sub.status as (typeof ACTIVE_STATUSES)[number])
      ? sub.plan
      : 'starter'

  return {
    membership,
    subscription: sub,
    effectivePlan: GOD_MODE ? 'enterprise' as SubscriptionPlan : effectivePlan,
    hasAccess: GOD_MODE || plans.includes(effectivePlan),
  }
}

export async function syncUserToDb() {
  const user = await currentUser()
  if (!user) return null

  const { orgId } = await auth()
  if (!orgId) return null

  return db.membership.upsert({
    where: {
      organizationId_clerkUserId: {
        organizationId: orgId,
        clerkUserId: user.id,
      },
    },
    update: {
      email: user.emailAddresses[0]?.emailAddress ?? "",
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.imageUrl,
    },
    create: {
      clerkUserId: user.id,
      email: user.emailAddresses[0]?.emailAddress ?? "",
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.imageUrl,
      organization: { connect: { clerkId: orgId } },
    },
  })
}

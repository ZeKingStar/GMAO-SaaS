import { headers } from "next/headers"
import { auth, type AuthSession } from "@/lib/better-auth"
import { db } from "@/lib/db"
import { MemberRole } from "@/generated/prisma/enums"
import type { SubscriptionPlan } from "@/generated/prisma/enums"

// Gate: ENABLE_GOD_MODE=true in .env.local + never active in production
// REMOVE BEFORE PUBLIC LAUNCH — tracked in .planning/todos/pending/god-mode-removal.md
const GOD_MODE = process.env.ENABLE_GOD_MODE === 'true' && process.env.NODE_ENV !== 'production'

export function isGodMode() {
  return GOD_MODE
}

async function getSession(): Promise<AuthSession> {
  return auth.api.getSession({ headers: await headers() }) as unknown as AuthSession
}

export async function getAuth() {
  const session = await getSession()
  if (!session?.user.id) return { userId: null, orgId: null }

  const userId = session.user.id

  // Better Auth doesn't serialize custom session fields — read activeOrganizationId from DB
  const dbSession = await db.session.findFirst({
    where: { userId, expiresAt: { gt: new Date() } },
    select: { id: true, activeOrganizationId: true },
    orderBy: { updatedAt: 'desc' },
  })

  let orgId = dbSession?.activeOrganizationId ?? null

  // Auto-assign first org on fresh login (session has no activeOrganizationId yet)
  if (!orgId && dbSession) {
    const membership = await db.membership.findFirst({
      where: { userId },
      select: { organizationId: true },
      orderBy: { createdAt: 'asc' },
    })
    if (membership) {
      orgId = membership.organizationId
      await db.session.update({
        where: { id: dbSession.id },
        data: { activeOrganizationId: orgId },
      })
    }
  }

  return { userId, orgId }
}

export async function setActiveOrganization(sessionId: string, orgId: string) {
  await db.session.update({
    where: { id: sessionId },
    data: { activeOrganizationId: orgId },
  })
}

export async function getOrganizationMembership() {
  const { userId, orgId } = await getAuth()
  if (!userId || !orgId) return null

  return db.membership.findFirst({
    where: { userId, organizationId: orgId },
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
  const session = await getSession()
  if (!session?.user) return null

  const { orgId } = await getAuth()
  if (!orgId) return null

  return db.membership.upsert({
    where: { organizationId_userId: { organizationId: orgId, userId: session.user.id } },
    update: {
      email: session.user.email,
      firstName: session.user.name?.split(" ")[0] ?? null,
      lastName: session.user.name?.split(" ").slice(1).join(" ") || null,
      avatarUrl: session.user.image ?? null,
    },
    create: {
      userId: session.user.id,
      organizationId: orgId,
      email: session.user.email,
      firstName: session.user.name?.split(" ")[0] ?? null,
      lastName: session.user.name?.split(" ").slice(1).join(" ") || null,
      avatarUrl: session.user.image ?? null,
      role: MemberRole.admin,
    },
  })
}

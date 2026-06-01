import { headers } from "next/headers"
import { auth, type AuthSession } from "@/lib/better-auth"
import { db } from "@/lib/db"
import { MemberRole } from "@/generated/prisma/enums"

async function getSession(): Promise<AuthSession> {
  return auth.api.getSession({ headers: await headers() }) as unknown as AuthSession
}

// Drop-in pour l'ancien auth() de Clerk.
// orgId = Organization.id directement — plus de lookup clerkId nécessaire.
export async function getAuth() {
  const session = await getSession()
  return {
    userId: session?.user.id ?? null,
    orgId: session?.session.activeOrganizationId ?? null,
  }
}

// Met à jour l'organisation active dans la session DB.
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
  if (!roles.includes(membership.role)) throw new Error("Forbidden")
  return membership
}

export async function syncUserToDb() {
  const session = await getSession()
  if (!session?.user) return null

  const orgId = session.session.activeOrganizationId ?? null
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

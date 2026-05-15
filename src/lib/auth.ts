import { auth, currentUser } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import type { MemberRole } from "@/generated/prisma/enums"

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
  if (!roles.includes(membership.role)) throw new Error("Forbidden")
  return membership
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

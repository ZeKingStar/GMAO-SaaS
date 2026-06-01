import { getAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { HeaderClient } from "./header-client"

export async function Header() {
  const { userId, orgId } = await getAuth()

  const [user, currentOrg, memberships] = await Promise.all([
    userId
      ? db.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, image: true } })
      : null,
    orgId
      ? db.organization.findUnique({ where: { id: orgId }, select: { id: true, name: true } })
      : null,
    userId
      ? db.membership.findMany({
          where: { userId },
          select: { organization: { select: { id: true, name: true } } },
        })
      : [],
  ])

  const orgs = memberships.map((m) => m.organization)

  return <HeaderClient user={user} currentOrg={currentOrg} orgs={orgs} />
}

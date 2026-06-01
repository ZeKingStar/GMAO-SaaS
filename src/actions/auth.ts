"use server"

import { headers } from "next/headers"
import { auth, type AuthSession } from "@/lib/better-auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function switchOrganization(orgId: string) {
  const session = await auth.api.getSession({ headers: await headers() }) as unknown as AuthSession
  if (!session?.user) throw new Error("Non autorisé")

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id, organizationId: orgId },
    select: { id: true },
  })
  if (!membership) throw new Error("Accès refusé")

  await db.session.update({
    where: { id: session.session.id },
    data: { activeOrganizationId: orgId },
  })

  revalidatePath("/", "layout")
}

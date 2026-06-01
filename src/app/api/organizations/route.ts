import { auth, type AuthSession } from "@/lib/better-auth"
import { db } from "@/lib/db"
import { z } from "zod"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

const schema = z.object({
  name: z.string().min(1),
  industry: z.string().optional(),
  size: z.string().optional(),
})

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() }) as unknown as AuthSession
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 })

  const { name, industry, size } = parsed.data

  const org = await db.organization.create({
    data: {
      name,
      industry: industry ?? null,
      size: size ?? null,
      subscription: {
        create: {
          plan: "starter",
          status: "trialing",
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      },
      members: {
        create: {
          userId: session.user.id,
          email: session.user.email,
          firstName: session.user.name?.split(" ")[0] ?? null,
          lastName: session.user.name?.split(" ").slice(1).join(" ") || null,
          avatarUrl: session.user.image ?? null,
          role: "admin",
        },
      },
    },
  })

  // Activer l'organisation dans la session
  await db.session.update({
    where: { id: session.session.id },
    data: { activeOrganizationId: org.id },
  })

  return NextResponse.json(org)
}

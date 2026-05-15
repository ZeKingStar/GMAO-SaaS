import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"

const schema = z.object({
  clerkId: z.string(),
  name: z.string().min(1),
  industry: z.string().optional(),
  size: z.string().optional(),
})

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 })

  const { clerkId, name, industry, size } = parsed.data

  const org = await db.organization.upsert({
    where: { clerkId },
    update: { name, industry: industry ?? null, size: size ?? null },
    create: {
      clerkId,
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
    },
  })

  return NextResponse.json(org)
}

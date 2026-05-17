import { headers } from "next/headers"
import { Webhook } from "svix"
import { db } from "@/lib/db"
import type { WebhookEvent } from "@clerk/nextjs/server"

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET
  if (!WEBHOOK_SECRET) return new Response("Missing webhook secret", { status: 500 })

  const headerPayload = await headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 })
  }

  const body = await req.text()

  const wh = new Webhook(WEBHOOK_SECRET)
  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch {
    return new Response("Invalid signature", { status: 400 })
  }

  const { type, data } = evt

  if (type === "organization.created") {
    await db.organization.upsert({
      where: { clerkId: data.id },
      update: { name: data.name, logoUrl: data.image_url ?? null },
      create: {
        clerkId: data.id,
        name: data.name,
        logoUrl: data.image_url ?? null,
        subscription: {
          create: {
            plan: "starter",
            status: "trialing",
            trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          },
        },
      },
    })
  }

  if (type === "organization.updated") {
    await db.organization.update({
      where: { clerkId: data.id },
      data: { name: data.name, logoUrl: data.image_url ?? null },
    })
  }

  if (type === "organization.deleted" && data.id) {
    await db.organization.delete({ where: { clerkId: data.id } }).catch(() => null)
  }

  if (type === "organizationMembership.created") {
    const orgId = data.organization.id
    const userId = data.public_user_data.user_id

    const org = await db.organization.findUnique({ where: { clerkId: orgId } })
    if (org) {
      await db.membership.upsert({
        where: { organizationId_clerkUserId: { organizationId: org.id, clerkUserId: userId } },
        update: {},
        create: {
          organizationId: org.id,
          clerkUserId: userId,
          email: data.public_user_data.identifier ?? "",
          firstName: data.public_user_data.first_name ?? null,
          lastName: data.public_user_data.last_name ?? null,
          avatarUrl: data.public_user_data.image_url ?? null,
          role: data.role === "org:admin" ? "admin" : "technician",
        },
      })
    }
  }

  if (type === "organizationMembership.deleted") {
    const orgId = data.organization.id
    const userId = data.public_user_data.user_id
    const org = await db.organization.findUnique({ where: { clerkId: orgId } })
    if (org) {
      await db.membership
        .delete({
          where: { organizationId_clerkUserId: { organizationId: org.id, clerkUserId: userId } },
        })
        .catch(() => null)
    }
  }

  return new Response("OK", { status: 200 })
}

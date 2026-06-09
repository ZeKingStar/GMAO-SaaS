"use server"

import { requireRole } from "@/lib/auth"
import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"
import { MemberRole } from "@/generated/prisma/enums"

type Plan = "starter" | "growth" | "enterprise"

const PRICE_IDS: Record<Plan, string | undefined> = {
  starter: process.env.STRIPE_PRICE_STARTER_MONTHLY,
  growth: process.env.STRIPE_PRICE_GROWTH_MONTHLY,
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY,
}

function appUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? process.env.BETTER_AUTH_URL
  if (!base) throw new Error("NEXT_PUBLIC_APP_URL non configuré")
  return `${base.replace(/\/$/, "")}${path}`
}

async function getOrCreateStripeCustomer(organizationId: string, email: string, orgName: string): Promise<string> {
  const subscription = await db.subscription.findUnique({
    where: { organizationId },
    select: { stripeCustomerId: true },
  })

  if (subscription?.stripeCustomerId) return subscription.stripeCustomerId

  const customer = await stripe.customers.create({
    email,
    name: orgName,
    metadata: { organizationId },
  })

  await db.subscription.upsert({
    where: { organizationId },
    create: { organizationId, stripeCustomerId: customer.id },
    update: { stripeCustomerId: customer.id },
  })

  return customer.id
}

export async function createCheckoutSession(plan: Plan): Promise<{ url: string }> {
  const membership = await requireRole([MemberRole.admin, MemberRole.manager])
  const { organizationId, organization } = membership

  const priceId = PRICE_IDS[plan]
  if (!priceId) throw new Error(`Prix Stripe non configuré pour le plan ${plan}`)

  const customerId = await getOrCreateStripeCustomer(
    organizationId,
    membership.email,
    organization.name
  )

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    // Le webhook checkout.session.completed lit metadata.organizationId
    metadata: { organizationId },
    success_url: appUrl("/parametres/organisation?checkout=success"),
    cancel_url: appUrl("/parametres/organisation?checkout=canceled"),
    locale: "fr-CA",
  })

  if (!session.url) throw new Error("Stripe n'a pas retourné d'URL de paiement")
  return { url: session.url }
}

export async function createBillingPortalSession(): Promise<{ url: string }> {
  const membership = await requireRole([MemberRole.admin, MemberRole.manager])

  const subscription = await db.subscription.findUnique({
    where: { organizationId: membership.organizationId },
    select: { stripeCustomerId: true },
  })

  if (!subscription?.stripeCustomerId) {
    throw new Error("Aucun client Stripe associé à cette organisation")
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: appUrl("/parametres/organisation"),
  })

  return { url: session.url }
}

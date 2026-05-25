'use server'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { stripe } from '@/lib/stripe'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

function getPriceId(plan: 'starter' | 'growth' | 'enterprise'): string {
  const priceIds = {
    starter: process.env.STRIPE_PRICE_STARTER_MONTHLY!,
    growth: process.env.STRIPE_PRICE_GROWTH_MONTHLY!,
    enterprise: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY!,
  }
  return priceIds[plan]
}

async function getOrg() {
  const { orgId, userId } = await auth()
  if (!orgId || !userId) throw new Error('Non autorisé')

  const org = await db.organization.findUnique({
    where: { clerkId: orgId },
    select: { id: true, name: true },
  })
  if (!org) throw new Error('Organisation introuvable')

  return { org, orgId }
}

export async function createCheckoutSession(
  plan: 'starter' | 'growth' | 'enterprise'
): Promise<{ url: string }> {
  const { org, orgId } = await getOrg()

  // Trouver ou créer le stripeCustomerId
  const subscription = await db.subscription.findUnique({
    where: { organizationId: org.id },
    select: { stripeCustomerId: true },
  })

  let stripeCustomerId = subscription?.stripeCustomerId ?? null

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      name: org.name,
      metadata: {
        organizationId: org.id,
        clerkOrgId: orgId,
      },
    })
    stripeCustomerId = customer.id
  }

  const priceId = getPriceId(plan)

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: stripeCustomerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${APP_URL}/parametres/organisation?success=1`,
    cancel_url: `${APP_URL}/parametres/organisation?canceled=1`,
    metadata: {
      organizationId: org.id,
    },
  })

  if (!session.url) throw new Error('Impossible de créer la session de paiement')

  return { url: session.url }
}

export async function createBillingPortalSession(): Promise<{ url: string }> {
  const { org } = await getOrg()

  const subscription = await db.subscription.findUnique({
    where: { organizationId: org.id },
    select: { stripeCustomerId: true },
  })

  if (!subscription?.stripeCustomerId) {
    throw new Error('Aucun abonnement actif')
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${APP_URL}/parametres/organisation`,
  })

  return { url: portalSession.url }
}

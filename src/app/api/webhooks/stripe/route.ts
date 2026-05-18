import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db'

function getPlanFromPriceId(priceId: string): 'starter' | 'growth' | 'enterprise' {
  if (priceId === process.env.STRIPE_PRICE_STARTER_MONTHLY) return 'starter'
  if (priceId === process.env.STRIPE_PRICE_GROWTH_MONTHLY) return 'growth'
  if (priceId === process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY) return 'enterprise'
  return 'starter'
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const organizationId = session.metadata?.organizationId

        if (!organizationId || !session.subscription) break

        const stripeSubscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        )

        const item = stripeSubscription.items.data[0]
        const priceId = item?.price.id ?? ''
        const plan = getPlanFromPriceId(priceId)
        const periodStart = item?.current_period_start ? new Date(item.current_period_start * 1000) : undefined
        const periodEnd = item?.current_period_end ? new Date(item.current_period_end * 1000) : undefined

        await db.subscription.upsert({
          where: { organizationId },
          create: {
            organizationId,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: stripeSubscription.id,
            stripePriceId: priceId,
            plan,
            status: 'active',
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
          },
          update: {
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: stripeSubscription.id,
            stripePriceId: priceId,
            plan,
            status: 'active',
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
          },
        })
        break
      }

      case 'customer.subscription.updated': {
        const stripeSubscription = event.data.object as Stripe.Subscription

        const existing = await db.subscription.findUnique({
          where: { stripeSubscriptionId: stripeSubscription.id },
          select: { organizationId: true },
        })

        if (!existing) break

        const updatedItem = stripeSubscription.items.data[0]
        const priceId = updatedItem?.price.id ?? ''
        const plan = getPlanFromPriceId(priceId)
        const rawStatus = stripeSubscription.status

        type SubscriptionStatusType = 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid'
        const statusMap: Record<string, SubscriptionStatusType> = {
          trialing: 'trialing',
          active: 'active',
          past_due: 'past_due',
          canceled: 'canceled',
          unpaid: 'unpaid',
        }
        const status: SubscriptionStatusType = statusMap[rawStatus] ?? 'active'

        await db.subscription.update({
          where: { stripeSubscriptionId: stripeSubscription.id },
          data: {
            stripePriceId: priceId,
            plan,
            status,
            currentPeriodStart: updatedItem?.current_period_start ? new Date(updatedItem.current_period_start * 1000) : undefined,
            currentPeriodEnd: updatedItem?.current_period_end ? new Date(updatedItem.current_period_end * 1000) : undefined,
          },
        })
        break
      }

      case 'customer.subscription.deleted': {
        const stripeSubscription = event.data.object as Stripe.Subscription

        await db.subscription.updateMany({
          where: { stripeSubscriptionId: stripeSubscription.id },
          data: { status: 'canceled' },
        })
        break
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`Stripe webhook handler error: ${message}`)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

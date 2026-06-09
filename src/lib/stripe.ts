import Stripe from 'stripe'

// Instanciation paresseuse : STRIPE_SECRET_KEY n'est requis qu'au premier
// appel runtime, pas au build (collecte de page data sans secrets).
let _stripe: Stripe | null = null

function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-04-22.dahlia',
    })
  }
  return _stripe
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const value = getStripe()[prop as keyof Stripe]
    return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(getStripe()) : value
  },
})

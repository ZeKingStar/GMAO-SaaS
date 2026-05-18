'use client'

import { useTransition, useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { createCheckoutSession, createBillingPortalSession } from '@/actions/billing'
import { CreditCard, Check, Zap } from 'lucide-react'

type Plan = 'starter' | 'growth' | 'enterprise'
type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid'

interface Subscription {
  plan: Plan
  status: SubscriptionStatus
  trialEndsAt: Date | null
  currentPeriodEnd: Date | null
}

const PLANS: {
  key: Plan
  name: string
  price: number
  features: string[]
}[] = [
  {
    key: 'starter',
    name: 'Démarrage',
    price: 59,
    features: ['50 actifs', '5 utilisateurs', 'Bons de travail', 'Maintenance préventive'],
  },
  {
    key: 'growth',
    name: 'Croissance',
    price: 149,
    features: ['200 actifs', '15 utilisateurs', 'Inventaire pièces', 'QR codes', 'Rapports avancés'],
  },
  {
    key: 'enterprise',
    name: 'Entreprise',
    price: 349,
    features: ['Actifs illimités', 'Utilisateurs illimités', 'API publique', 'Support prioritaire'],
  },
]

const STATUS_LABELS: Record<SubscriptionStatus, { label: string; class: string }> = {
  trialing: { label: 'Essai gratuit', class: 'bg-blue-100 text-blue-700' },
  active: { label: 'Actif', class: 'bg-green-100 text-green-700' },
  past_due: { label: 'Paiement en retard', class: 'bg-yellow-100 text-yellow-700' },
  canceled: { label: 'Annulé', class: 'bg-red-100 text-red-700' },
  unpaid: { label: 'Non payé', class: 'bg-red-100 text-red-700' },
}

export function BillingSection({ subscription }: { subscription: Subscription | null }) {
  const [pending, startTransition] = useTransition()
  const [loadingPlan, setLoadingPlan] = useState<Plan | null>(null)
  const [loadingPortal, setLoadingPortal] = useState(false)

  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing'
  const currentPlan = subscription?.plan ?? 'starter'

  function handleUpgrade(plan: Plan) {
    setLoadingPlan(plan)
    startTransition(async () => {
      try {
        const { url } = await createCheckoutSession(plan)
        window.location.href = url
      } catch {
        toast.error('Impossible d\'initier le paiement')
        setLoadingPlan(null)
      }
    })
  }

  function handlePortal() {
    setLoadingPortal(true)
    startTransition(async () => {
      try {
        const { url } = await createBillingPortalSession()
        window.location.href = url
      } catch {
        toast.error('Impossible d\'accéder au portail de facturation')
        setLoadingPortal(false)
      }
    })
  }

  return (
    <div className="space-y-5">
      {/* En-tête statut */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {subscription && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_LABELS[subscription.status].class}`}>
              {STATUS_LABELS[subscription.status].label}
            </span>
          )}
          {subscription?.status === 'trialing' && subscription.trialEndsAt && (
            <span className="text-xs text-muted-foreground">
              Essai jusqu&apos;au {new Date(subscription.trialEndsAt).toLocaleDateString('fr-CA')}
            </span>
          )}
          {isActive && subscription?.currentPeriodEnd && (
            <span className="text-xs text-muted-foreground">
              Prochain renouvellement : {new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-CA')}
            </span>
          )}
        </div>
        {isActive && (
          <Button
            variant="outline"
            size="sm"
            onClick={handlePortal}
            disabled={pending && loadingPortal}
          >
            <CreditCard className="h-3.5 w-3.5 mr-1.5" />
            Gérer la facturation
          </Button>
        )}
      </div>

      {/* Cards des plans */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const isCurrent = isActive && currentPlan === plan.key
          const isPopular = plan.key === 'growth'

          return (
            <div
              key={plan.key}
              className={`relative rounded-lg border p-5 space-y-4 ${
                isCurrent
                  ? 'border-primary bg-primary/5'
                  : isPopular
                  ? 'border-primary/40'
                  : 'bg-card'
              }`}
            >
              {isPopular && !isCurrent && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    Populaire
                  </span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">{plan.name}</h3>
                  {isCurrent && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                      Actuel
                    </span>
                  )}
                </div>
                <p className="mt-1">
                  <span className="text-2xl font-bold">{plan.price}$</span>
                  <span className="text-muted-foreground text-xs ml-1">CAD/mois</span>
                </p>
              </div>

              <ul className="space-y-1.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                className="w-full"
                variant={isCurrent ? 'outline' : 'default'}
                size="sm"
                disabled={isCurrent || (pending && loadingPlan === plan.key)}
                onClick={() => !isCurrent && handleUpgrade(plan.key)}
              >
                {isCurrent ? 'Plan actuel' : pending && loadingPlan === plan.key ? 'Redirection…' : 'Choisir ce plan'}
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

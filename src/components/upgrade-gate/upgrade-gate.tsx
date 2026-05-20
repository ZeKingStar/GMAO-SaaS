import Link from 'next/link'
import { Lock } from 'lucide-react'

interface UpgradeGateProps {
  hasAccess: boolean
  requiredPlan?: 'growth' | 'enterprise'  // default: 'growth'
  children: React.ReactNode
}

export function UpgradeGate({ hasAccess, requiredPlan = 'growth', children }: UpgradeGateProps) {
  if (hasAccess) return <>{children}</>

  const planName = requiredPlan === 'growth' ? 'Croissance' : 'Entreprise'

  return (
    <div className="relative">
      {/* Amber upgrade banner — per D-09, UI-SPEC §UpgradeGate banner */}
      <div className="flex items-center justify-between gap-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 mb-4 dark:bg-amber-950/20 dark:border-amber-800">
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
          <Lock className="h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
          <span className="text-sm">
            Passez au plan {planName} pour accéder à cette fonctionnalité
          </span>
        </div>
        <Link
          href="/parametres/organisation"
          className="shrink-0 rounded-md bg-amber-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-600 transition-colors"
        >
          Voir les plans
        </Link>
      </div>

      {/* Blurred content preview — per D-10 */}
      <div className="blur-sm pointer-events-none select-none" aria-hidden="true">
        {children}
      </div>
    </div>
  )
}

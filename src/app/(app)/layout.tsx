import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { getOrganizationMembership } from "@/lib/auth"

const ACTIVE_STATUSES = ['active', 'trialing'] as const

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { userId, orgId } = await auth()
  if (!userId) redirect('/sign-in')
  if (!orgId) redirect('/onboarding')

  const membership = await getOrganizationMembership()

  // Derive effective plan — null sub or inactive status = 'starter' (fail-safe)
  const sub = membership?.organization?.subscription
  const effectivePlan: 'starter' | 'growth' | 'enterprise' =
    sub && ACTIVE_STATUSES.includes(sub.status as (typeof ACTIVE_STATUSES)[number])
      ? (sub.plan as 'starter' | 'growth' | 'enterprise')
      : 'starter'

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userPlan={effectivePlan} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userPlan={effectivePlan} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

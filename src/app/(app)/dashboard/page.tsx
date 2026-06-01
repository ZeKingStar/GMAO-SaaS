import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { getAuth } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ClipboardList, Cpu, AlertTriangle, Clock, Calendar } from "lucide-react"
import { db } from "@/lib/db"
import { WorkOrderStatusBadge } from "@/components/work-orders/work-order-status-badge"
import { createBillingPortalSession } from "@/actions/billing"
import type { WorkOrderPriority, MaintenanceFrequency } from "@/generated/prisma/enums"

export const metadata: Metadata = { title: "Tableau de bord" }

const PRIORITY_COLORS: Record<WorkOrderPriority, string> = {
  low: "bg-blue-500",
  medium: "bg-yellow-500",
  high: "bg-orange-500",
  urgent: "bg-red-500",
}

const FREQUENCY_LABELS: Record<MaintenanceFrequency, string> = {
  daily: "Quotidien",
  weekly: "Hebdo",
  biweekly: "Bihebdo",
  monthly: "Mensuel",
  quarterly: "Trimestriel",
  semi_annual: "Semestriel",
  annual: "Annuel",
  custom: "Personnalisé",
}

const PLAN_NAMES: Record<string, string> = {
  starter: 'Démarrage',
  growth: 'Croissance',
  enterprise: 'Entreprise',
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  trialing: { label: 'Essai gratuit',       className: 'bg-blue-100 text-blue-700' },
  active:   { label: 'Actif',               className: 'bg-green-100 text-green-700' },
  past_due: { label: 'Paiement en retard',  className: 'bg-yellow-100 text-yellow-700' },
  canceled: { label: 'Annulé',              className: 'bg-red-100 text-red-700' },
  unpaid:   { label: 'Non payé',            className: 'bg-red-100 text-red-700' },
}

function formatRenewalDate(date: Date): string {
  return date.toLocaleDateString('fr-CA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default async function DashboardPage() {
  const { orgId } = await getAuth()
  if (!orgId) redirect("/sign-in")

  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: { id: true },
  })
  if (!org) redirect("/onboarding")

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    openCount,
    inProgressCount,
    assetCount,
    overdueCount,
    resolvedThisMonth,
    recentWorkOrders,
    maintenancePlans,
  ] = await Promise.all([
    // KPI 1 — BTs ouverts (open + in_progress + on_hold)
    db.workOrder.count({
      where: {
        organizationId: org.id,
        status: { in: ["open", "in_progress", "on_hold"] },
      },
    }),
    // KPI 1 — subset: in_progress pour la description
    db.workOrder.count({
      where: {
        organizationId: org.id,
        status: "in_progress",
      },
    }),
    // KPI 2 — Actifs actifs
    db.asset.count({
      where: { organizationId: org.id },
    }),
    // KPI 3 — BT en retard
    db.workOrder.count({
      where: {
        organizationId: org.id,
        dueDate: { lt: now },
        status: { notIn: ["resolved", "closed"] },
      },
    }),
    // KPI 4 — MTTR: BTs résolus/fermés ce mois avec completedAt
    db.workOrder.findMany({
      where: {
        organizationId: org.id,
        status: { in: ["resolved", "closed"] },
        completedAt: { not: null, gte: startOfMonth },
      },
      select: { createdAt: true, completedAt: true },
    }),
    // Section BTs récents
    db.workOrder.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, number: true, title: true, status: true, priority: true, createdAt: true },
    }),
    // Section Prochaines maintenances
    db.maintenancePlan.findMany({
      where: { organizationId: org.id, isActive: true },
      orderBy: [{ lastGeneratedAt: { sort: "asc", nulls: "first" } }],
      take: 5,
      include: { asset: { select: { name: true } } },
    }),
  ])

  const subscription = org?.subscription ?? null

  // Calcul MTTR
  let mttrDisplay = "—h"
  if (resolvedThisMonth.length > 0) {
    const totalHours = resolvedThisMonth.reduce((sum, wo) => {
      const completed = wo.completedAt as Date
      const diffMs = completed.getTime() - wo.createdAt.getTime()
      return sum + diffMs / (1000 * 60 * 60)
    }, 0)
    const avg = Math.round(totalHours / resolvedThisMonth.length)
    mttrDisplay = `${avg}h`
  }

  const kpis = [
    {
      title: "Bons de travail ouverts",
      icon: ClipboardList,
      value: String(openCount),
      description: `dont ${inProgressCount} en cours`,
    },
    {
      title: "Actifs actifs",
      icon: Cpu,
      value: String(assetCount),
      description: "équipements",
    },
    {
      title: "BT en retard",
      icon: AlertTriangle,
      value: String(overdueCount),
      description: "passé l'échéance",
    },
    {
      title: "MTTR moyen",
      icon: Clock,
      value: mttrDisplay,
      description: "délai moyen résolution",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Tableau de bord</h2>
        <p className="text-muted-foreground text-sm">
          Vue d&apos;ensemble de votre maintenance
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ title, icon: Icon, value, description }) => (
          <Card key={title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
              <p className="text-xs text-muted-foreground">{description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Bons de travail récents */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bons de travail récents</CardTitle>
          </CardHeader>
          <CardContent>
            {recentWorkOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun bon de travail</p>
            ) : (
              <div className="space-y-1">
                {recentWorkOrders.map((wo) => (
                  <Link
                    key={wo.id}
                    href={`/bons-de-travail/${wo.id}`}
                    className="flex items-center gap-3 py-2 px-2 hover:bg-muted/50 rounded-md"
                  >
                    <div
                      className={`h-9 w-9 rounded-md flex items-center justify-center shrink-0 ${PRIORITY_COLORS[wo.priority]}`}
                    >
                      <span className="text-white text-xs font-bold">#{wo.number}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{wo.title}</p>
                    </div>
                    <WorkOrderStatusBadge status={wo.status} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Prochaines maintenances */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Prochaines maintenances</CardTitle>
          </CardHeader>
          <CardContent>
            {maintenancePlans.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun plan de maintenance actif</p>
            ) : (
              <div className="space-y-1">
                {maintenancePlans.map((plan) => (
                  <Link
                    key={plan.id}
                    href="/maintenance"
                    className="flex items-center gap-3 py-2 px-2 hover:bg-muted/50 rounded-md"
                  >
                    <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center shrink-0">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{plan.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {plan.asset?.name ?? ""}
                        {plan.frequency ? ` · ${FREQUENCY_LABELS[plan.frequency]}` : ""}
                      </p>
                    </div>
                    <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium text-green-600 border-green-300 bg-green-50 shrink-0">
                      Actif
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Widget Abonnement — D-12, D-13, D-14, GATE-03 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-normal">Votre abonnement</CardTitle>
        </CardHeader>
        <CardContent>
          {subscription === null ? (
            /* Cas 4 — Aucun abonnement */
            <div className="space-y-3">
              <p className="text-sm font-bold">Aucun abonnement actif</p>
              <p className="text-sm text-muted-foreground">
                Débloquez les rapports, l&apos;inventaire et le scan QR.
              </p>
              <Link
                href="/parametres/organisation"
                className="inline-flex h-7 items-center justify-center rounded-[min(var(--radius-md),12px)] border border-transparent bg-primary px-2.5 text-[0.8rem] font-medium text-primary-foreground whitespace-nowrap transition-all"
              >
                Choisir un plan
              </Link>
            </div>
          ) : subscription.status === 'canceled' ? (
            /* Cas 3 — Annulé */
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_LABELS.canceled.className}`}
                >
                  {STATUS_LABELS.canceled.label}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Votre accès aux fonctionnalités avancées a été suspendu
              </p>
              <Link
                href="/parametres/organisation"
                className="inline-flex h-7 items-center justify-center rounded-[min(var(--radius-md),12px)] border border-transparent bg-primary px-2.5 text-[0.8rem] font-medium text-primary-foreground whitespace-nowrap transition-all"
              >
                Choisir un plan
              </Link>
            </div>
          ) : subscription.status === 'past_due' || subscription.status === 'unpaid' ? (
            /* Cas 2 — Paiement en retard */
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold">
                  Plan {PLAN_NAMES[subscription.plan] ?? subscription.plan}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_LABELS[subscription.status].className}`}
                >
                  {STATUS_LABELS[subscription.status].label}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Mettre à jour vos informations de paiement
              </p>
              <form
                action={async () => {
                  'use server'
                  const { url } = await createBillingPortalSession()
                  redirect(url)
                }}
              >
                <Button type="submit" variant="outline" size="sm">
                  Mettre à jour la facturation
                </Button>
              </form>
            </div>
          ) : (
            /* Cas 1 — active / trialing */
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold">
                  Plan {PLAN_NAMES[subscription.plan] ?? subscription.plan}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_LABELS[subscription.status]?.className ?? 'bg-gray-100 text-gray-700'}`}
                >
                  {STATUS_LABELS[subscription.status]?.label ?? subscription.status}
                </span>
              </div>
              {subscription.currentPeriodEnd && (
                <p className="text-sm text-muted-foreground">
                  Renouvellement le {formatRenewalDate(subscription.currentPeriodEnd)}
                </p>
              )}
              {subscription.status === 'trialing' && subscription.trialEndsAt && (
                <p className="text-sm text-muted-foreground">
                  Essai gratuit jusqu&apos;au {formatRenewalDate(subscription.trialEndsAt)}
                </p>
              )}
              <Link
                href="/parametres/organisation"
                className="inline-flex h-7 items-center justify-center rounded-[min(var(--radius-md),12px)] border border-border bg-background px-2.5 text-[0.8rem] font-medium whitespace-nowrap transition-all hover:bg-muted hover:text-foreground"
              >
                Gérer l&apos;abonnement
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

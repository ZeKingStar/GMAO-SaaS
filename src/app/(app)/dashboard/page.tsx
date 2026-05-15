import type { Metadata } from "next"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ClipboardList, Cpu, AlertTriangle, Clock } from "lucide-react"

export const metadata: Metadata = { title: "Tableau de bord" }

const kpis = [
  { title: "Bons de travail ouverts", icon: ClipboardList, value: "—", description: "en cours" },
  { title: "Actifs actifs", icon: Cpu, value: "—", description: "équipements" },
  { title: "BT en retard", icon: AlertTriangle, value: "—", description: "passé l'échéance" },
  { title: "MTTR moyen", icon: Clock, value: "—", description: "heures" },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Tableau de bord</h2>
        <p className="text-muted-foreground text-sm">
          Vue d'ensemble de votre maintenance
        </p>
      </div>

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
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bons de travail récents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-md" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Prochaines maintenances</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-md" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

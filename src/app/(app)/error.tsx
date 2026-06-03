"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    // Log côté client pour faciliter le diagnostic (visible dans la console nav).
    console.error("[app error boundary]", error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="size-6 text-destructive" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Un problème est survenu</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Cette section n&apos;a pas pu s&apos;afficher. Vous pouvez réessayer ou
          revenir au tableau de bord — vos données n&apos;ont pas été touchées.
        </p>
        {error.digest && (
          <p className="pt-1 font-mono text-xs text-muted-foreground/70">
            Réf. {error.digest}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <Button onClick={() => reset()}>Réessayer</Button>
        <Button
          variant="outline"
          onClick={() => {
            router.push("/dashboard")
            router.refresh()
          }}
        >
          Tableau de bord
        </Button>
      </div>
    </div>
  )
}

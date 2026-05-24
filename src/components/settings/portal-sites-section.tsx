'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  enablePortal,
  disablePortal,
  regeneratePortalToken,
} from '@/actions/sites'
import { Copy, Check, RotateCcw, Globe, Power, PowerOff } from 'lucide-react'

export type PortalSiteRow = {
  id: string
  name: string
  portalToken: string | null
  portalEnabled: boolean
}

function portalUrl(token: string): string {
  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL ?? '')
  return `${origin}/portail/${token}`
}

export function PortalSitesSection({ initialSites }: { initialSites: PortalSiteRow[] }) {
  const [sites, setSites] = useState<PortalSiteRow[]>(initialSites)
  const [isPending, startTransition] = useTransition()
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [regenerateTarget, setRegenerateTarget] = useState<PortalSiteRow | null>(null)

  function handleEnable(site: PortalSiteRow) {
    startTransition(async () => {
      try {
        const { portalToken } = await enablePortal(site.id)
        setSites((prev) =>
          prev.map((s) => (s.id === site.id ? { ...s, portalToken, portalEnabled: true } : s))
        )
        toast.success('Portail activé')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erreur')
      }
    })
  }

  function handleDisable(site: PortalSiteRow) {
    startTransition(async () => {
      try {
        await disablePortal(site.id)
        setSites((prev) =>
          prev.map((s) => (s.id === site.id ? { ...s, portalEnabled: false } : s))
        )
        toast.success('Portail désactivé')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erreur')
      }
    })
  }

  function handleRegenerate(site: PortalSiteRow) {
    startTransition(async () => {
      try {
        const { portalToken } = await regeneratePortalToken(site.id)
        setSites((prev) =>
          prev.map((s) => (s.id === site.id ? { ...s, portalToken } : s))
        )
        toast.success('Nouveau lien généré')
        setRegenerateTarget(null)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erreur')
      }
    })
  }

  async function handleCopy(site: PortalSiteRow) {
    if (!site.portalToken) return
    await navigator.clipboard.writeText(portalUrl(site.portalToken))
    setCopiedId(site.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Portails publics
          </CardTitle>
          <CardDescription>
            Générez une URL publique par site pour permettre à n&apos;importe quel
            employé de soumettre une demande de maintenance sans compte Korvia.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sites.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucun site. Créez un site dans la section Actifs.</p>
          )}
          {sites.map((site) => (
            <div key={site.id} className="rounded-md border p-4 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div className="font-medium">{site.name}</div>
                {site.portalEnabled ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDisable(site)}
                    disabled={isPending}
                  >
                    <PowerOff className="h-4 w-4 mr-1" /> Désactiver
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleEnable(site)}
                    disabled={isPending}
                  >
                    <Power className="h-4 w-4 mr-1" /> Activer le portail
                  </Button>
                )}
              </div>
              {site.portalEnabled && site.portalToken && (
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-muted rounded px-2 py-1 truncate">
                    {portalUrl(site.portalToken)}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(site)}
                    aria-label="Copier l'URL"
                  >
                    {copiedId === site.id ? (
                      <>
                        <Check className="h-4 w-4 mr-1" /> Copié
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" /> Copier
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRegenerateTarget(site)}
                    aria-label="Régénérer le lien"
                  >
                    <RotateCcw className="h-4 w-4 mr-1" /> Régénérer
                  </Button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog
        open={regenerateTarget !== null}
        onOpenChange={(open) => !open && setRegenerateTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Régénérer le lien du portail ?</DialogTitle>
            <DialogDescription>
              L&apos;ancien lien deviendra immédiatement invalide. Toute personne
              qui possède l&apos;ancienne URL ne pourra plus l&apos;utiliser.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegenerateTarget(null)}>
              Annuler
            </Button>
            <Button
              onClick={() => regenerateTarget && handleRegenerate(regenerateTarget)}
              disabled={isPending}
            >
              Régénérer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

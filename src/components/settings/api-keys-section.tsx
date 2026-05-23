'use client'

import { useState, useTransition } from 'react'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  createApiKey,
  revokeApiKey,
  listApiKeys,
  type ApiKeyListItem,
  type CreatedApiKey,
} from '@/actions/api-keys'
import { AlertTriangle, Check, Copy, KeyRound, Trash2 } from 'lucide-react'

export function ApiKeysSection({ initialKeys }: { initialKeys: ApiKeyListItem[] }) {
  const [keys, setKeys] = useState<ApiKeyListItem[]>(initialKeys)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [created, setCreated] = useState<CreatedApiKey | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        const result = await createApiKey(name)
        setCreated(result)
        const updated = await listApiKeys()
        setKeys(updated)
        setName('')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      }
    })
  }

  async function handleRevoke(id: string) {
    if (
      !confirm(
        "Révoquer cette clé ? Les systèmes utilisant cette clé perdront immédiatement l'accès.",
      )
    )
      return
    startTransition(async () => {
      await revokeApiKey(id)
      const updated = await listApiKeys()
      setKeys(updated)
    })
  }

  function handleClose() {
    setOpen(false)
    setCreated(null) // ← raw key wiped on close (T-4-18)
    setCopied(false)
    setError(null)
    setName('')
  }

  async function handleCopy() {
    if (!created) return
    await navigator.clipboard.writeText(created.key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      handleClose()
    } else {
      setOpen(true)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5" /> Clés API
        </CardTitle>
        <CardDescription>
          Gérez les clés permettant aux systèmes externes d&apos;accéder à l&apos;API Korvia.{' '}
          <a href="/api/docs" className="underline hover:text-foreground">
            Voir la documentation
          </a>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={() => setOpen(true)}>Générer une clé API</Button>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogContent>
            {!created ? (
              <form onSubmit={handleCreate}>
                <DialogHeader>
                  <DialogTitle>Générer une nouvelle clé API</DialogTitle>
                </DialogHeader>
                <div className="grid gap-2 py-4">
                  <Label htmlFor="key-name">Nom de la clé</Label>
                  <Input
                    id="key-name"
                    value={name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                    placeholder="ex: Intégration ERP"
                    required
                    minLength={1}
                    maxLength={100}
                  />
                  {error && <p className="text-sm text-destructive">{error}</p>}
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={isPending || !name.trim()}>
                    Générer
                  </Button>
                </DialogFooter>
              </form>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Clé générée : {created.name}</DialogTitle>
                </DialogHeader>
                <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive flex gap-2 mt-2">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>
                    Cette clé ne sera plus jamais affichée. Copiez-la maintenant et stockez-la en
                    lieu sûr.
                  </span>
                </div>
                <div className="flex gap-2 mt-3">
                  <Input readOnly value={created.key} className="font-mono text-xs" />
                  <Button
                    type="button"
                    onClick={handleCopy}
                    variant="outline"
                    size="icon-sm"
                    aria-label="Copier"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <DialogFooter>
                  <Button onClick={handleClose}>J&apos;ai copié la clé</Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        <div className="mt-6">
          {keys.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune clé API générée.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 font-medium">Nom</th>
                  <th className="py-2 font-medium">Créée le</th>
                  <th className="py-2 font-medium">Dernière utilisation</th>
                  <th className="py-2 font-medium">Statut</th>
                  <th className="py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.id} className="border-b">
                    <td className="py-3">{k.name}</td>
                    <td className="py-3">
                      {new Date(k.createdAt).toLocaleDateString('fr-CA')}
                    </td>
                    <td className="py-3">
                      {k.lastUsedAt
                        ? new Date(k.lastUsedAt).toLocaleDateString('fr-CA')
                        : '—'}
                    </td>
                    <td className="py-3">
                      {k.isActive ? (
                        <span className="text-green-700">Actif</span>
                      ) : (
                        <span className="text-muted-foreground">Révoquée</span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      {k.isActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevoke(k.id)}
                          disabled={isPending}
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Révoquer
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

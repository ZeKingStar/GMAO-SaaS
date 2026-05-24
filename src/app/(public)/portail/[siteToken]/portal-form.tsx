'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type ActionState =
  | { status: 'idle' }
  | { status: 'success'; workOrderNumber: number }
  | { status: 'error'; message: string; fieldErrors?: Record<string, string> }

async function submitAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const siteToken = String(formData.get('siteToken') ?? '')
  const payload = {
    requesterName: String(formData.get('requesterName') ?? ''),
    requesterEmail: String(formData.get('requesterEmail') ?? ''),
    description: String(formData.get('description') ?? ''),
    locationDescription: String(formData.get('locationDescription') ?? '') || undefined,
    honeypot: String(formData.get('website') ?? ''), // champ piège nommé 'website'
  }
  const res = await fetch(`/api/portal/${siteToken}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (res.status === 204) {
    // honeypot triggered — feindre le succès
    return { status: 'success', workOrderNumber: 0 }
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Erreur réseau' }))
    return { status: 'error', message: data.error ?? 'Erreur', fieldErrors: undefined }
  }
  const data = await res.json()
  return { status: 'success', workOrderNumber: data.number }
}

export function PortalForm({ siteToken }: { siteToken: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    submitAction,
    { status: 'idle' }
  )

  if (state.status === 'success' && state.workOrderNumber > 0) {
    return (
      <div className="rounded-md border bg-card p-6">
        <h2 className="text-lg font-semibold">Demande reçue</h2>
        <p className="mt-2 text-sm">
          Votre demande a été enregistrée sous le numéro{' '}
          <strong>#{state.workOrderNumber}</strong>. Vous recevrez une confirmation
          par email.
        </p>
      </div>
    )
  }
  if (state.status === 'success') {
    // honeypot path — même UI que succès
    return (
      <div className="rounded-md border bg-card p-6">
        <h2 className="text-lg font-semibold">Demande reçue</h2>
        <p className="mt-2 text-sm">Votre demande a été enregistrée.</p>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="siteToken" value={siteToken} />
      {/* Honeypot — nommé 'website' pour piéger les bots. Invisible aux humains. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px' }}
      />

      <div className="space-y-1">
        <Label htmlFor="requesterName">Votre nom</Label>
        <Input id="requesterName" name="requesterName" required maxLength={100} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="requesterEmail">Votre email</Label>
        <Input id="requesterEmail" name="requesterEmail" type="email" required maxLength={200} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="locationDescription">Localisation (optionnel)</Label>
        <Input id="locationDescription" name="locationDescription" maxLength={200} placeholder="Ex: 2e étage, salle B-203" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="description">Description du problème</Label>
        <Textarea id="description" name="description" required minLength={10} maxLength={1000} rows={5} />
      </div>

      {state.status === 'error' && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Envoi en cours…' : 'Envoyer la demande'}
      </Button>
    </form>
  )
}

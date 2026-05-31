'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { inviteMember } from '@/actions/settings'
import { getAvailableRoles } from '@/lib/invitation-roles'
import { ROLE_LABELS } from '@/components/settings/team-table'
import type { MemberRole } from '@/generated/prisma/enums'

type Props = {
  currentRole: MemberRole
}

export function InviteDialog({ currentRole }: Props) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<MemberRole>('technician')

  const roles = getAvailableRoles(currentRole)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    startTransition(async () => {
      try {
        await inviteMember(email, role)
        toast.success(`Invitation envoyée à ${email}`)
        setOpen(false)
        setEmail('')
        setRole('technician')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erreur lors de l'envoi de l'invitation")
      }
    })
  }

  return (
    <>
      <Button variant="default" size="sm" onClick={() => setOpen(true)}>
        <UserPlus className="h-4 w-4" />
        Inviter un membre
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Inviter un membre</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Adresse e-mail</Label>
                <Input
                  id="invite-email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="prenom.nom@exemple.com"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label>Rôle</Label>
                <Select value={role} onValueChange={v => setRole(v as MemberRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(r => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Annuler l&apos;invitation
              </Button>
              <Button type="submit" variant="default" disabled={pending}>
                Envoyer l&apos;invitation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { revokeInvitation } from '@/actions/settings'
import { ROLE_LABELS, ROLE_VARIANTS } from '@/components/settings/team-table'
import type { MemberRole } from '@/generated/prisma/enums'

type Invitation = {
  id: string
  emailAddress: string
  role: MemberRole
  createdAt: number
}

type Props = {
  invitations: Invitation[]
}

function formatDate(createdAt: number): string {
  return new Intl.DateTimeFormat('fr-CA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(createdAt))
}

export function PendingInvitationsSection({ invitations }: Props) {
  if (invitations.length === 0) return null

  return <PendingInvitationsList invitations={invitations} />
}

function PendingInvitationsList({ invitations }: Props) {
  const [revoking, startTransition] = useTransition()
  const [revokingId, setRevokingId] = useState<string | null>(null)

  function handleRevoke(id: string) {
    setRevokingId(id)
    startTransition(async () => {
      try {
        await revokeInvitation(id)
        toast.success('Invitation révoquée')
      } catch {
        toast.error('Erreur lors de la révocation')
      } finally {
        setRevokingId(null)
      }
    })
  }

  return (
    <div className="mt-8">
      <h3 className="text-base font-medium mb-4">Invitations en attente</h3>
      <div>
        {invitations.map(inv => (
          <div
            key={inv.id}
            className="flex items-center justify-between py-2 border-b border-border last:border-b-0"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">{inv.emailAddress}</span>
              <Badge variant={ROLE_VARIANTS[inv.role]} className="text-xs">
                {ROLE_LABELS[inv.role]}
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground">
                Envoyé le {formatDate(inv.createdAt)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                disabled={revoking && revokingId === inv.id}
                onClick={() => handleRevoke(inv.id)}
              >
                Révoquer l&apos;invitation
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

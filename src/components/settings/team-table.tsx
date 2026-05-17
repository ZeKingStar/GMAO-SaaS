'use client'

import { useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { updateMemberRole } from '@/actions/settings'
import type { MemberRole } from '@/generated/prisma/enums'

const SELECT_CLASS = 'h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring/50'

const ROLE_LABELS: Record<MemberRole, string> = {
  admin: 'Admin',
  manager: 'Gestionnaire',
  technician: 'Technicien',
  requester: 'Demandeur',
  viewer: 'Lecteur',
}

const ROLE_VARIANTS: Record<MemberRole, 'default' | 'secondary' | 'outline'> = {
  admin: 'default',
  manager: 'default',
  technician: 'secondary',
  requester: 'outline',
  viewer: 'outline',
}

type Member = {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  avatarUrl: string | null
  role: MemberRole
  createdAt: Date
}

type Props = {
  members: Member[]
  currentMembershipId: string
  currentRole: MemberRole
}

export function TeamTable({ members, currentMembershipId, currentRole }: Props) {
  const [, startTransition] = useTransition()
  const canManage = currentRole === 'admin' || currentRole === 'manager'

  function handleRoleChange(membershipId: string, role: string) {
    startTransition(async () => {
      try {
        await updateMemberRole(membershipId, role as MemberRole)
        toast.success('Rôle mis à jour')
      } catch {
        toast.error('Erreur lors de la mise à jour')
      }
    })
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 border-b">
          <tr>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Membre</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden md:table-cell">Courriel</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Rôle</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden lg:table-cell">Depuis</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {members.map(member => {
            const isSelf = member.id === currentMembershipId
            const fullName = [member.firstName, member.lastName].filter(Boolean).join(' ') || '—'
            const initials = [member.firstName?.[0], member.lastName?.[0]].filter(Boolean).join('').toUpperCase() || member.email[0].toUpperCase()

            return (
              <tr key={member.id} className="bg-card hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {member.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={member.avatarUrl} alt={fullName} className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                        {initials}
                      </div>
                    )}
                    <span className="font-medium">
                      {fullName}
                      {isSelf && <span className="text-xs text-muted-foreground ml-1">(moi)</span>}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">
                  {member.email}
                </td>
                <td className="px-4 py-3">
                  {canManage && !isSelf ? (
                    <select
                      value={member.role}
                      onChange={e => handleRoleChange(member.id, e.target.value)}
                      className={SELECT_CLASS}
                    >
                      {(Object.keys(ROLE_LABELS) as MemberRole[]).map(r => (
                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                      ))}
                    </select>
                  ) : (
                    <Badge variant={ROLE_VARIANTS[member.role]} className="text-xs">
                      {ROLE_LABELS[member.role]}
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground">
                  {new Intl.DateTimeFormat('fr-CA', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(member.createdAt))}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

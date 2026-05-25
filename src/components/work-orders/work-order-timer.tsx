'use client'

import { useEffect, useState, useTransition } from 'react'
import { Play, Square, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { startTimer, stopTimer, closeActiveTimer } from '@/actions/work-orders'
import type { MemberRole, WorkOrderStatus } from '@/generated/prisma/enums'

type ActiveSession = {
  id: string
  startedAt: Date
  membership: { id: string; firstName: string | null; lastName: string | null }
}

type Props = {
  workOrderId: string
  workOrderStatus: WorkOrderStatus
  activeSession: ActiveSession | null
  currentMembershipId: string
  currentRole: MemberRole
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function WorkOrderTimer({ workOrderId, workOrderStatus, activeSession, currentMembershipId, currentRole }: Props) {
  const [, startTransition] = useTransition()
  const [elapsed, setElapsed] = useState(() =>
    activeSession ? Math.floor((Date.now() - new Date(activeSession.startedAt).getTime()) / 1000) : 0
  )

  // Live tick toutes les secondes tant qu'une session est active
  useEffect(() => {
    if (!activeSession) { setElapsed(0); return }
    const startMs = new Date(activeSession.startedAt).getTime()
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - startMs) / 1000)))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [activeSession])

  const canStart = workOrderStatus === 'in_progress' && !activeSession
  const isOwnSession = activeSession?.membership.id === currentMembershipId
  const isManager = currentRole === 'admin' || currentRole === 'manager'

  function handleStart() {
    startTransition(async () => {
      try { await startTimer(workOrderId); toast.success('Minuteur démarré') }
      catch (e) { toast.error(e instanceof Error ? e.message : 'Erreur') }
    })
  }

  function handleStop() {
    if (!activeSession) return
    startTransition(async () => {
      try { await stopTimer(activeSession.id); toast.success('Minuteur arrêté') }
      catch (e) { toast.error(e instanceof Error ? e.message : 'Erreur') }
    })
  }

  function handleCloseOther() {
    if (!activeSession) return
    if (!confirm(`Fermer la session de ${activeSession.membership.firstName ?? 'ce membre'} ?`)) return
    startTransition(async () => {
      try { await closeActiveTimer(activeSession.id); toast.success('Session fermée') }
      catch (e) { toast.error(e instanceof Error ? e.message : 'Erreur') }
    })
  }

  // Si BT pas démarré et aucune session → ne pas afficher de UI (rien à faire)
  if (!activeSession && workOrderStatus !== 'in_progress') return null

  return (
    <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
      {activeSession ? (
        <>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground">
              Minuteur actif — {activeSession.membership.firstName ?? '?'} {activeSession.membership.lastName ?? ''}
            </div>
            <div className="font-mono text-lg tabular-nums">{formatElapsed(elapsed)}</div>
          </div>
          {isOwnSession ? (
            <Button onClick={handleStop} size="sm" variant="outline">
              <Square className="h-4 w-4 mr-1.5" />Arrêter
            </Button>
          ) : isManager ? (
            <Button onClick={handleCloseOther} size="sm" variant="ghost" title="Fermer la session d'un autre membre">
              <X className="h-4 w-4 mr-1.5" />Fermer
            </Button>
          ) : null}
        </>
      ) : canStart ? (
        <>
          <div className="flex-1 text-sm text-muted-foreground">Démarrer le minuteur pour cette intervention</div>
          <Button onClick={handleStart} size="sm">
            <Play className="h-4 w-4 mr-1.5" />Démarrer
          </Button>
        </>
      ) : null}
    </div>
  )
}

'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Wrench } from 'lucide-react'
import { generateWorkOrderFromPlan } from '@/actions/maintenance'

type Props = { planId: string; planName: string; disabled?: boolean }

export function GenerateWorkOrderButton({ planId, planName, disabled }: Props) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleClick() {
    if (!confirm(`Générer un bon de travail pré-rempli depuis le plan « ${planName} » ?`)) return
    startTransition(async () => {
      try {
        const wo = await generateWorkOrderFromPlan(planId)
        toast.success(`Bon de travail #${wo.number} créé`)
        router.push(`/bons-de-travail/${wo.id}`)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erreur')
      }
    })
  }

  return (
    <Button variant="default" size="sm" onClick={handleClick} disabled={disabled || pending}>
      <Wrench className="mr-2 h-4 w-4" />
      {pending ? 'Génération…' : 'Générer un BT'}
    </Button>
  )
}

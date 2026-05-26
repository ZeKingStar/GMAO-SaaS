'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { PERIOD_VALUES, PERIOD_LABELS, DEFAULT_PERIOD, type Period } from '@/lib/report-utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type Props = { value: Period }

export function PeriodSelector({ value }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  function onChange(next: string | null) {
    if (!next) return
    const params = new URLSearchParams(searchParams.toString())
    if (next === DEFAULT_PERIOD) {
      params.delete('period')
    } else {
      params.set('period', next)
    }
    const query = params.toString()
    startTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname)
    })
  }

  return (
    <Select value={value} onValueChange={onChange} disabled={isPending}>
      <SelectTrigger className="w-[180px]" aria-label="Période d'analyse">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PERIOD_VALUES.map((p) => (
          <SelectItem key={p} value={p}>
            {PERIOD_LABELS[p]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

'use client'

import { AlertTriangle } from 'lucide-react'
import {
  validateClosure,
  type ClosureRequirements,
  CLOSURE_FIELD_LABELS,
} from '@/lib/closure-requirements'

type Input = {
  faultCategory: string | null
  faultDescription: string | null
  timeLogsMinutesTotal: number
  partsCount: number
}

export function computeMissingForClosure(input: Input, req: ClosureRequirements): string[] {
  return validateClosure(input, req)
}

type Props = {
  missing: string[]
}

export function WorkOrderClosureBanner({ missing }: Props) {
  if (missing.length === 0) return null
  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-3 flex gap-3">
      <AlertTriangle className="h-5 w-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
      <div className="space-y-1 text-sm">
        <p className="font-medium text-amber-900 dark:text-amber-200">
          Pour clore ce bon, complétez :
        </p>
        <ul className="list-disc list-inside text-amber-800 dark:text-amber-300 space-y-0.5">
          {missing.map(key => (
            <li key={key}>{CLOSURE_FIELD_LABELS[key as keyof typeof CLOSURE_FIELD_LABELS] ?? key}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

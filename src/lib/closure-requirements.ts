export type ClosureRequirements = {
  faultCode: boolean
  timeSpent: boolean
  partsUsed: boolean
}

export const DEFAULT_CLOSURE_REQUIREMENTS: ClosureRequirements = {
  faultCode: false,
  timeSpent: false,
  partsUsed: false,
}

export const FAULT_CATEGORIES = ['mecanique', 'electrique', 'hydraulique', 'autre'] as const
export type FaultCategory = typeof FAULT_CATEGORIES[number]

export const FAULT_CATEGORY_LABELS: Record<FaultCategory, string> = {
  mecanique: 'Mécanique',
  electrique: 'Électrique',
  hydraulique: 'Hydraulique',
  autre: 'Autre',
}

export const CLOSURE_FIELD_LABELS = {
  faultCode: 'Code de panne (catégorie + description)',
  timeSpent: 'Temps passé (au moins une session enregistrée)',
  partsUsed: 'Pièces utilisées (au moins une pièce ajoutée)',
} as const

export type ClosureCheckInput = {
  faultCategory: string | null
  faultDescription: string | null
  timeLogsMinutesTotal: number
  partsCount: number
}

export function validateClosure(input: ClosureCheckInput, req: ClosureRequirements): string[] {
  const missing: string[] = []
  if (req.faultCode) {
    const cat = input.faultCategory?.trim()
    const desc = input.faultDescription?.trim()
    if (!cat || !desc) missing.push('faultCode')
  }
  if (req.timeSpent && input.timeLogsMinutesTotal <= 0) missing.push('timeSpent')
  if (req.partsUsed && input.partsCount <= 0) missing.push('partsUsed')
  return missing
}

// Helper pour lire depuis Organization.closureRequirements (Json | null)
export function parseClosureRequirements(raw: unknown): ClosureRequirements {
  if (!raw || typeof raw !== 'object') return DEFAULT_CLOSURE_REQUIREMENTS
  const r = raw as Record<string, unknown>
  return {
    faultCode: typeof r.faultCode === 'boolean' ? r.faultCode : false,
    timeSpent: typeof r.timeSpent === 'boolean' ? r.timeSpent : false,
    partsUsed: typeof r.partsUsed === 'boolean' ? r.partsUsed : false,
  }
}

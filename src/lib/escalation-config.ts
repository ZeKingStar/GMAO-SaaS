export type EscalationConfig = {
  enabled: boolean
  delayHours: number
}

export const DEFAULT_ESCALATION_CONFIG: EscalationConfig = {
  enabled: false,
  delayHours: 4,
}

export const ESCALATION_FIELD_LABELS = {
  enabled: "Activer l'escalade des bons urgents",
  delayHours: "Délai avant escalade (heures)",
} as const

export function parseEscalationConfig(raw: unknown): EscalationConfig {
  if (!raw || typeof raw !== 'object') return DEFAULT_ESCALATION_CONFIG
  const r = raw as Record<string, unknown>
  const delayHours =
    typeof r.delayHours === 'number' && Number.isFinite(r.delayHours) && r.delayHours > 0
      ? r.delayHours
      : DEFAULT_ESCALATION_CONFIG.delayHours
  return {
    enabled: typeof r.enabled === 'boolean' ? r.enabled : false,
    delayHours,
  }
}

export const PERIOD_VALUES = ['month', '3m', '6m', 'year'] as const
export type Period = typeof PERIOD_VALUES[number]

export const PERIOD_LABELS: Record<Period, string> = {
  month: 'Ce mois',
  '3m': '3 mois',
  '6m': '6 mois',
  year: 'Cette année',
}

export const DEFAULT_PERIOD: Period = 'month'

export function isPeriod(value: string | undefined | null): value is Period {
  return typeof value === 'string' && (PERIOD_VALUES as readonly string[]).includes(value)
}

export function getPeriodStart(period: Period): Date {
  const now = new Date()
  switch (period) {
    case 'month':
      return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
    case '3m':
      return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate(), 0, 0, 0, 0)
    case '6m':
      return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate(), 0, 0, 0, 0)
    case 'year':
      return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate(), 0, 0, 0, 0)
  }
}

export function formatCurrency(amount: number | null | undefined): string {
  const value = typeof amount === 'number' && Number.isFinite(amount) ? amount : 0
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

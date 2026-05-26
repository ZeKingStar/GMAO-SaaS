/**
 * Unit tests for report-utils — Phase 7 FIAB-01
 *
 * Tests utility functions:
 * - getPeriodStart() for month/3m/6m/year periods
 * - isPeriod() type guard
 * - formatCurrency() fr-CA locale formatting
 */
import { describe, it, expect } from 'vitest'
import { getPeriodStart, isPeriod, formatCurrency } from '@/lib/report-utils'

describe('getPeriodStart', () => {
  it('Test 1: retourne le 1er du mois courant à minuit pour "month"', () => {
    const result = getPeriodStart('month')
    const now = new Date()
    expect(result.getFullYear()).toBe(now.getFullYear())
    expect(result.getMonth()).toBe(now.getMonth())
    expect(result.getDate()).toBe(1)
    expect(result.getHours()).toBe(0)
    expect(result.getMinutes()).toBe(0)
    expect(result.getSeconds()).toBe(0)
  })

  it('Test 2: retourne une Date 3 mois en arrière pour "3m"', () => {
    const result = getPeriodStart('3m')
    const now = new Date()
    const expected = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate(), 0, 0, 0, 0)
    expect(result.getTime()).toBeCloseTo(expected.getTime(), -3)
  })

  it('Test 3: retourne une Date 6 mois en arrière pour "6m"', () => {
    const result = getPeriodStart('6m')
    const now = new Date()
    const expected = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate(), 0, 0, 0, 0)
    expect(result.getTime()).toBeCloseTo(expected.getTime(), -3)
  })

  it('Test 4: retourne une Date un an en arrière pour "year"', () => {
    const result = getPeriodStart('year')
    const now = new Date()
    const expected = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate(), 0, 0, 0, 0)
    expect(result.getTime()).toBeCloseTo(expected.getTime(), -3)
  })
})

describe('isPeriod', () => {
  it('Test 5: isPeriod("month") === true, isPeriod("foo") === false, isPeriod(undefined) === false', () => {
    expect(isPeriod('month')).toBe(true)
    expect(isPeriod('3m')).toBe(true)
    expect(isPeriod('6m')).toBe(true)
    expect(isPeriod('year')).toBe(true)
    expect(isPeriod('foo')).toBe(false)
    expect(isPeriod(undefined)).toBe(false)
  })
})

describe('formatCurrency', () => {
  it('Test 6: formatCurrency(1234.56) contient "1" "234" "," "56" et "$"', () => {
    const result = formatCurrency(1234.56)
    expect(result).toContain('1')
    expect(result).toContain('234')
    expect(result).toContain(',')
    expect(result).toContain('56')
    expect(result).toContain('$')
  })

  it('Test 7: formatCurrency(0) contient "0,00" et "$"', () => {
    const result = formatCurrency(0)
    expect(result).toContain('0,00')
    expect(result).toContain('$')
  })

  it('Test 8: formatCurrency(null as any) ne lance pas et retourne une valeur avec "$"', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => formatCurrency(null as any)).not.toThrow()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = formatCurrency(null as any)
    expect(result).toContain('$')
    expect(result).toContain('0,00')
  })
})

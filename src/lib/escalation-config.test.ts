/**
 * Unit tests pour parseEscalationConfig() — Phase 8 PROD-01 + PROD-03
 *
 * Tests pure function parseEscalationConfig avec 9 cas couvrant :
 * - Entrées nulles / undefined / non-objet → défaut
 * - Valeurs valides → retour correct
 * - enabled non-boolean → false
 * - delayHours invalide (≤ 0, négatif, non-nombre) → délai par défaut
 */
import { describe, it, expect } from 'vitest'
import { parseEscalationConfig, DEFAULT_ESCALATION_CONFIG } from '@/lib/escalation-config'

describe('parseEscalationConfig', () => {
  it('Test 1: retourne DEFAULT si raw est undefined', () => {
    expect(parseEscalationConfig(undefined)).toEqual(DEFAULT_ESCALATION_CONFIG)
  })

  it('Test 2: retourne DEFAULT si raw est null', () => {
    expect(parseEscalationConfig(null)).toEqual(DEFAULT_ESCALATION_CONFIG)
  })

  it('Test 3: retourne DEFAULT si raw est un objet vide', () => {
    expect(parseEscalationConfig({})).toEqual(DEFAULT_ESCALATION_CONFIG)
  })

  it('Test 4: retourne les valeurs correctes si raw est valide', () => {
    expect(parseEscalationConfig({ enabled: true, delayHours: 8 })).toEqual({
      enabled: true,
      delayHours: 8,
    })
  })

  it('Test 5: retourne enabled=false si enabled est une string (non-bool)', () => {
    expect(parseEscalationConfig({ enabled: 'yes', delayHours: 8 })).toEqual({
      enabled: false,
      delayHours: 8,
    })
  })

  it('Test 6: retourne delayHours par défaut si delayHours est 0 (≤ 0)', () => {
    expect(parseEscalationConfig({ enabled: true, delayHours: 0 })).toEqual({
      enabled: true,
      delayHours: DEFAULT_ESCALATION_CONFIG.delayHours,
    })
  })

  it('Test 7: retourne delayHours par défaut si delayHours est négatif', () => {
    expect(parseEscalationConfig({ enabled: true, delayHours: -5 })).toEqual({
      enabled: true,
      delayHours: DEFAULT_ESCALATION_CONFIG.delayHours,
    })
  })

  it('Test 8: retourne delayHours par défaut si delayHours est une string', () => {
    expect(parseEscalationConfig({ enabled: true, delayHours: 'abc' })).toEqual({
      enabled: true,
      delayHours: DEFAULT_ESCALATION_CONFIG.delayHours,
    })
  })

  it('Test 9: retourne DEFAULT si raw est une string (non-objet)', () => {
    expect(parseEscalationConfig('garbage')).toEqual(DEFAULT_ESCALATION_CONFIG)
  })
})

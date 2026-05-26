/**
 * Unit tests for validateClosure() — Phase 6 TERRAIN-01
 *
 * Tests pure function validateClosure with 9 cases covering:
 * - All requirements disabled (should return [])
 * - faultCode required: missing category, empty description, valid both
 * - timeSpent required: 0 minutes, positive minutes
 * - partsUsed required: 0 parts, 1+ parts
 * - Multi-missing: all required but nothing provided
 */
import { describe, it, expect } from 'vitest'
import { validateClosure, type ClosureCheckInput, type ClosureRequirements } from '@/lib/closure-requirements'

const noReq: ClosureRequirements = { faultCode: false, timeSpent: false, partsUsed: false }
const allReq: ClosureRequirements = { faultCode: true, timeSpent: true, partsUsed: true }
const emptyInput: ClosureCheckInput = {
  faultCategory: null,
  faultProblem: null,
  timeLogsMinutesTotal: 0,
  partsCount: 0,
}

describe('validateClosure', () => {
  it('Test 1: retourne [] quand aucune exigence activée', () => {
    expect(validateClosure(emptyInput, noReq)).toEqual([])
  })

  it('Test 2: retourne [faultCode] si faultCode requis mais faultCategory null', () => {
    const req: ClosureRequirements = { faultCode: true, timeSpent: false, partsUsed: false }
    const input: ClosureCheckInput = {
      ...emptyInput,
      faultCategory: null,
      faultProblem: null,
    }
    expect(validateClosure(input, req)).toEqual(['faultCode'])
  })

  it('Test 3: retourne [faultCode] si catégorie présente mais problème vide', () => {
    const req: ClosureRequirements = { faultCode: true, timeSpent: false, partsUsed: false }
    const input: ClosureCheckInput = {
      ...emptyInput,
      faultCategory: 'mecanique',
      faultProblem: '',
    }
    expect(validateClosure(input, req)).toEqual(['faultCode'])
  })

  it('Test 4: retourne [] si faultCode requis et catégorie + problème présents', () => {
    const req: ClosureRequirements = { faultCode: true, timeSpent: false, partsUsed: false }
    const input: ClosureCheckInput = {
      ...emptyInput,
      faultCategory: 'mecanique',
      faultProblem: 'roulement HS',
    }
    expect(validateClosure(input, req)).toEqual([])
  })

  it('Test 5: retourne [timeSpent] si timeSpent requis et 0 minutes', () => {
    const req: ClosureRequirements = { faultCode: false, timeSpent: true, partsUsed: false }
    const input: ClosureCheckInput = { ...emptyInput, timeLogsMinutesTotal: 0 }
    expect(validateClosure(input, req)).toEqual(['timeSpent'])
  })

  it('Test 6: retourne [] si timeSpent requis et 15 minutes', () => {
    const req: ClosureRequirements = { faultCode: false, timeSpent: true, partsUsed: false }
    const input: ClosureCheckInput = { ...emptyInput, timeLogsMinutesTotal: 15 }
    expect(validateClosure(input, req)).toEqual([])
  })

  it('Test 7: retourne [partsUsed] si partsUsed requis et 0 pièces', () => {
    const req: ClosureRequirements = { faultCode: false, timeSpent: false, partsUsed: true }
    const input: ClosureCheckInput = { ...emptyInput, partsCount: 0 }
    expect(validateClosure(input, req)).toEqual(['partsUsed'])
  })

  it('Test 8: retourne [] si partsUsed requis et 1 pièce', () => {
    const req: ClosureRequirements = { faultCode: false, timeSpent: false, partsUsed: true }
    const input: ClosureCheckInput = { ...emptyInput, partsCount: 1 }
    expect(validateClosure(input, req)).toEqual([])
  })

  it('Test 9: retourne tous les codes manquants dans le bon ordre si multi-manquants', () => {
    const input: ClosureCheckInput = {
      faultCategory: null,
      faultProblem: null,
      timeLogsMinutesTotal: 0,
      partsCount: 0,
    }
    expect(validateClosure(input, allReq)).toEqual(['faultCode', 'timeSpent', 'partsUsed'])
  })
})

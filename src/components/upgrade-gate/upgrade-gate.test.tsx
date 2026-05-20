/**
 * RTL render tests for <UpgradeGate> — Phase 2 GATE-02
 *
 * RED state: upgrade-gate.tsx does not yet exist. Stubs will fail until Plan 02-01 Task 2.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { UpgradeGate } from '@/components/upgrade-gate/upgrade-gate'

describe('<UpgradeGate>', () => {
  it('renders children directly when hasAccess is true', () => {
    render(
      <UpgradeGate hasAccess={true}>
        <p>Protected content</p>
      </UpgradeGate>
    )
    expect(screen.getByText('Protected content')).toBeInTheDocument()
    expect(screen.queryByText(/Passez au plan/i)).not.toBeInTheDocument()
  })

  it('renders amber upgrade banner when hasAccess is false', () => {
    render(
      <UpgradeGate hasAccess={false} requiredPlan="growth">
        <p>Protected content</p>
      </UpgradeGate>
    )
    expect(screen.getByText(/Passez au plan Croissance/i)).toBeInTheDocument()
  })

  it('renders Voir les plans CTA link pointing to /parametres/organisation', () => {
    render(
      <UpgradeGate hasAccess={false} requiredPlan="growth">
        <p>Protected content</p>
      </UpgradeGate>
    )
    const link = screen.getByRole('link', { name: /Voir les plans/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/parametres/organisation')
  })

  it('renders blurred children with aria-hidden when hasAccess is false', () => {
    const { container } = render(
      <UpgradeGate hasAccess={false}>
        <p>Protected content</p>
      </UpgradeGate>
    )
    const blurZone = container.querySelector('[aria-hidden="true"]')
    expect(blurZone).not.toBeNull()
    expect(blurZone).toHaveClass('blur-sm')
  })

  it('uses Entreprise plan name when requiredPlan is enterprise', () => {
    render(
      <UpgradeGate hasAccess={false} requiredPlan="enterprise">
        <p>Protected content</p>
      </UpgradeGate>
    )
    expect(screen.getByText(/Passez au plan Entreprise/i)).toBeInTheDocument()
  })

  it('defaults to growth plan name when requiredPlan is omitted', () => {
    render(
      <UpgradeGate hasAccess={false}>
        <p>Protected content</p>
      </UpgradeGate>
    )
    expect(screen.getByText(/Passez au plan Croissance/i)).toBeInTheDocument()
  })
})

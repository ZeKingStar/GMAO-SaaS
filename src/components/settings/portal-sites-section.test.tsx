/**
 * Unit tests for <PortalSitesSection> — Phase 5 PORTAL-01
 *
 * Tests: empty state, site list rendering, toggle enable/disable, copy URL, regenerate token.
 * Mocking: @/actions/sites (enablePortal, disablePortal, regeneratePortalToken), sonner, clipboard
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { PortalSiteRow } from '@/components/settings/portal-sites-section'

// Mock the Server Actions
vi.mock('@/actions/sites', () => ({
  enablePortal: vi.fn(),
  disablePortal: vi.fn(),
  regeneratePortalToken: vi.fn(),
}))

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

import { enablePortal, disablePortal, regeneratePortalToken } from '@/actions/sites'
import { toast } from 'sonner'
import { PortalSitesSection } from '@/components/settings/portal-sites-section'

const disabledSite: PortalSiteRow = {
  id: 'site-1',
  name: 'Usine Nord',
  portalToken: null,
  portalEnabled: false,
}

const enabledSite: PortalSiteRow = {
  id: 'site-2',
  name: 'Bureau Central',
  portalToken: 'abc-token-123',
  portalEnabled: true,
}

// Clipboard spy — re-created before each test so vi.clearAllMocks() doesn't break it
let writeTextSpy: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
  writeTextSpy = vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: writeTextSpy },
    writable: true,
    configurable: true,
  })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('<PortalSitesSection>', () => {
  // ─── Test B1: Empty state ──────────────────────────────────────────────────

  it('B1: renders "Aucun site" when initialSites is empty', () => {
    render(<PortalSitesSection initialSites={[]} />)
    expect(screen.getByText(/aucun site/i)).toBeInTheDocument()
  })

  // ─── Test B2: Disabled site ───────────────────────────────────────────────

  it('B2: with a disabled site, shows site name, "Activer" button, and no URL', () => {
    render(<PortalSitesSection initialSites={[disabledSite]} />)
    expect(screen.getByText('Usine Nord')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /activer le portail/i })).toBeInTheDocument()
    // No URL should be shown
    expect(screen.queryByRole('button', { name: /copier/i })).not.toBeInTheDocument()
  })

  // ─── Test B3: Enabled site ────────────────────────────────────────────────

  it('B3: with an enabled site + token, shows URL, Copier, Désactiver, Régénérer buttons', () => {
    render(<PortalSitesSection initialSites={[enabledSite]} />)
    expect(screen.getByText('Bureau Central')).toBeInTheDocument()
    expect(screen.getByText(/\/portail\/abc-token-123/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /copier/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /désactiver/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /régénérer/i })).toBeInTheDocument()
  })

  // ─── Test B4: Enable portal ───────────────────────────────────────────────

  it('B4: clicking "Activer" calls enablePortal and updates UI with returned token', async () => {
    const user = userEvent.setup()
    vi.mocked(enablePortal).mockResolvedValue({ portalToken: 'new-token-xyz' })

    render(<PortalSitesSection initialSites={[disabledSite]} />)

    await user.click(screen.getByRole('button', { name: /activer le portail/i }))

    await waitFor(() => {
      expect(enablePortal).toHaveBeenCalledWith('site-1')
      expect(screen.getByText(/\/portail\/new-token-xyz/)).toBeInTheDocument()
    })

    expect(toast.success).toHaveBeenCalledWith('Portail activé')
  })

  // ─── Test B5: Disable portal ──────────────────────────────────────────────

  it('B5: clicking "Désactiver" calls disablePortal and hides the URL', async () => {
    const user = userEvent.setup()
    vi.mocked(disablePortal).mockResolvedValue(undefined)

    render(<PortalSitesSection initialSites={[enabledSite]} />)

    await user.click(screen.getByRole('button', { name: /désactiver/i }))

    await waitFor(() => {
      expect(disablePortal).toHaveBeenCalledWith('site-2')
      // URL should no longer be shown
      expect(screen.queryByText(/\/portail\/abc-token-123/)).not.toBeInTheDocument()
    })

    expect(toast.success).toHaveBeenCalledWith('Portail désactivé')
  })

  // ─── Test B6: Copy URL ────────────────────────────────────────────────────

  it('B6: clicking "Copier" writes URL to clipboard and shows "Copié"', async () => {
    const user = userEvent.setup()
    // Spy on the clipboard that the component will actually call
    const clipboardSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)

    render(<PortalSitesSection initialSites={[enabledSite]} />)

    await user.click(screen.getByRole('button', { name: /copier/i }))

    // Button should now show "Copié" state (clipboard was invoked)
    await waitFor(() => {
      expect(screen.getByText(/copié/i)).toBeInTheDocument()
    })

    // Clipboard writeText should have been called with the portal URL
    expect(clipboardSpy).toHaveBeenCalledWith(
      expect.stringContaining('/portail/abc-token-123'),
    )
  })

  // ─── Test B7: Regenerate token ────────────────────────────────────────────

  it('B7: clicking "Régénérer" opens Dialog, confirming calls regeneratePortalToken and updates token', async () => {
    const user = userEvent.setup()
    vi.mocked(regeneratePortalToken).mockResolvedValue({ portalToken: 'regen-token-999' })

    render(<PortalSitesSection initialSites={[enabledSite]} />)

    // Click Régénérer to open dialog
    await user.click(screen.getByRole('button', { name: /régénérer/i }))

    // Dialog should open
    await waitFor(() => {
      expect(screen.getByText(/régénérer le lien du portail/i)).toBeInTheDocument()
    })

    // Confirm in dialog
    const confirmBtn = screen.getByRole('button', { name: /^régénérer$/i })
    await user.click(confirmBtn)

    await waitFor(() => {
      expect(regeneratePortalToken).toHaveBeenCalledWith('site-2')
      expect(screen.getByText(/\/portail\/regen-token-999/)).toBeInTheDocument()
    })

    expect(toast.success).toHaveBeenCalledWith('Nouveau lien généré')
  })
})

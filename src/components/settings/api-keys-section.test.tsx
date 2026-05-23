/**
 * Unit tests for <ApiKeysSection> — Phase 4 API-04
 *
 * Tests key generation flow, list rendering, revocation, and security properties.
 * Mocking: @/actions/api-keys (createApiKey, listApiKeys, revokeApiKey)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ApiKeyListItem } from '@/actions/api-keys'

// Mock the Server Actions
vi.mock('@/actions/api-keys', () => ({
  createApiKey: vi.fn(),
  listApiKeys: vi.fn(),
  revokeApiKey: vi.fn(),
}))

import { createApiKey, listApiKeys, revokeApiKey } from '@/actions/api-keys'
import { ApiKeysSection } from '@/components/settings/api-keys-section'

const mockKey: ApiKeyListItem = {
  id: 'k1',
  name: 'Production',
  createdAt: new Date('2026-05-23T00:00:00Z'),
  lastUsedAt: null,
  isActive: true,
  expiresAt: null,
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(listApiKeys).mockResolvedValue([])
})

// ─── Test 1: Empty state ──────────────────────────────────────────────────────

describe('<ApiKeysSection>', () => {
  it('Test 1: renders "Aucune clé API générée." when initialKeys is empty', () => {
    render(<ApiKeysSection initialKeys={[]} />)
    expect(screen.getByText('Aucune clé API générée.')).toBeInTheDocument()
  })

  // ─── Test 2: Key list rendering ────────────────────────────────────────────

  it('Test 2: renders a row with key name and Révoquer button for active key', () => {
    render(<ApiKeysSection initialKeys={[mockKey]} />)
    expect(screen.getByText('Production')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /révoquer/i })).toBeInTheDocument()
  })

  // ─── Test 3: Dialog opens ──────────────────────────────────────────────────

  it('Test 3: clicking "Générer une clé API" opens the dialog with name input', async () => {
    const user = userEvent.setup()
    render(<ApiKeysSection initialKeys={[]} />)

    await user.click(screen.getByRole('button', { name: /générer une clé api/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/nom de la clé/i)).toBeInTheDocument()
    })
  })

  // ─── Test 4: createApiKey called with typed name ────────────────────────────

  it('Test 4: submitting form calls createApiKey with the typed name', async () => {
    const user = userEvent.setup()
    const generatedKey = {
      id: 'k2',
      name: 'Test Key',
      key: 'krv_abc123',
      createdAt: new Date(),
    }
    vi.mocked(createApiKey).mockResolvedValue(generatedKey)
    vi.mocked(listApiKeys).mockResolvedValue([
      { id: 'k2', name: 'Test Key', createdAt: new Date(), lastUsedAt: null, isActive: true, expiresAt: null },
    ])

    render(<ApiKeysSection initialKeys={[]} />)

    await user.click(screen.getByRole('button', { name: /générer une clé api/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/nom de la clé/i)).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText(/nom de la clé/i), 'Test Key')
    await user.click(screen.getByRole('button', { name: /^générer$/i }))

    await waitFor(() => {
      expect(createApiKey).toHaveBeenCalledWith('Test Key')
    })
  })

  // ─── Test 5: Generated key displayed with warning ──────────────────────────

  it('Test 5: after successful creation, generated key and warning banner are shown', async () => {
    const user = userEvent.setup()
    const generatedKey = {
      id: 'k2',
      name: 'Test Key',
      key: 'krv_abc123def456',
      createdAt: new Date(),
    }
    vi.mocked(createApiKey).mockResolvedValue(generatedKey)
    vi.mocked(listApiKeys).mockResolvedValue([])

    render(<ApiKeysSection initialKeys={[]} />)

    await user.click(screen.getByRole('button', { name: /générer une clé api/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/nom de la clé/i)).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText(/nom de la clé/i), 'Test Key')
    await user.click(screen.getByRole('button', { name: /^générer$/i }))

    await waitFor(() => {
      // Warning banner shown
      expect(screen.getByText(/cette clé ne sera plus jamais affichée/i)).toBeInTheDocument()
      // Key displayed in read-only input
      const keyInput = screen.getByDisplayValue('krv_abc123def456')
      expect(keyInput).toBeInTheDocument()
      expect(keyInput).toHaveAttribute('readonly')
    })
  })

  // ─── Test 6: Raw key wiped after closing ────────────────────────────────────

  it('Test 6: closing the dialog and re-opening shows empty form (raw key wiped)', async () => {
    const user = userEvent.setup()
    const generatedKey = {
      id: 'k2',
      name: 'Test Key',
      key: 'krv_secret_key_value',
      createdAt: new Date(),
    }
    vi.mocked(createApiKey).mockResolvedValue(generatedKey)
    vi.mocked(listApiKeys).mockResolvedValue([])

    render(<ApiKeysSection initialKeys={[]} />)

    // Open dialog
    await user.click(screen.getByRole('button', { name: /générer une clé api/i }))
    await waitFor(() => expect(screen.getByLabelText(/nom de la clé/i)).toBeInTheDocument())

    // Submit form
    await user.type(screen.getByLabelText(/nom de la clé/i), 'Test Key')
    await user.click(screen.getByRole('button', { name: /^générer$/i }))

    // Wait for key to be shown
    await waitFor(() => {
      expect(screen.getByDisplayValue('krv_secret_key_value')).toBeInTheDocument()
    })

    // Close dialog by clicking "J'ai copié la clé"
    await user.click(screen.getByRole('button', { name: /j'ai copié/i }))

    await waitFor(() => {
      // Key no longer in DOM
      expect(screen.queryByDisplayValue('krv_secret_key_value')).not.toBeInTheDocument()
    })

    // Re-open dialog — should show name input (form state), not previous key
    await user.click(screen.getByRole('button', { name: /générer une clé api/i }))
    await waitFor(() => {
      expect(screen.getByLabelText(/nom de la clé/i)).toBeInTheDocument()
      expect(screen.queryByText(/cette clé ne sera plus jamais affichée/i)).not.toBeInTheDocument()
    })
  })

  // ─── Test 7: revokeApiKey called on Révoquer click ──────────────────────────

  it('Test 7: clicking Révoquer calls revokeApiKey with the key id', async () => {
    const user = userEvent.setup()
    vi.mocked(revokeApiKey).mockResolvedValue({ id: 'k1', isActive: false })
    vi.mocked(listApiKeys).mockResolvedValue([
      { ...mockKey, isActive: false },
    ])

    // Mock window.confirm to return true
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(<ApiKeysSection initialKeys={[mockKey]} />)

    await user.click(screen.getByRole('button', { name: /révoquer/i }))

    await waitFor(() => {
      expect(revokeApiKey).toHaveBeenCalledWith('k1')
    })
  })
})

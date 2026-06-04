import '@testing-library/jest-dom'
import { vi } from 'vitest'

vi.mock('@/lib/db', () => ({
  db: {
    membership: {
      findFirst: vi.fn(),
      upsert: vi.fn(),
    },
    // getAuth() reads activeOrganizationId from db.session (Better Auth doesn't
    // serialize custom session fields) — mocked here for the shared db mock.
    session: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}))

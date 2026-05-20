import '@testing-library/jest-dom'
import { vi } from 'vitest'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: null, orgId: null }),
  currentUser: vi.fn().mockResolvedValue(null),
}))

vi.mock('@/lib/db', () => ({
  db: {
    membership: {
      findFirst: vi.fn(),
      upsert: vi.fn(),
    },
  },
}))

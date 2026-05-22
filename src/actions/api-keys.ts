'use server'

import { randomBytes, createHash } from 'crypto'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'

export type CreatedApiKey = {
  id: string
  name: string
  key: string  // ← returned ONCE, never again
  createdAt: Date
}

export type ApiKeyListItem = {
  id: string
  name: string
  createdAt: Date
  lastUsedAt: Date | null
  isActive: boolean
  expiresAt: Date | null
}

export async function createApiKey(name: string): Promise<CreatedApiKey> {
  const membership = await requireRole(['admin', 'manager'])
  const trimmedName = name.trim()
  if (!trimmedName || trimmedName.length > 100) {
    throw new Error('Le nom de la clé doit faire entre 1 et 100 caractères')
  }

  const rawKey = `krv_${randomBytes(32).toString('hex')}`
  const hashedKey = createHash('sha256').update(rawKey).digest('hex')

  const created = await db.apiKey.create({
    data: {
      organizationId: membership.organizationId,
      name: trimmedName,
      hashedKey,
      isActive: true,
    },
    select: { id: true, name: true, createdAt: true },
  })

  revalidatePath('/parametres/organisation')
  return { id: created.id, name: created.name, key: rawKey, createdAt: created.createdAt }
}

export async function listApiKeys(): Promise<ApiKeyListItem[]> {
  const membership = await requireRole(['admin', 'manager'])
  return db.apiKey.findMany({
    where: { organizationId: membership.organizationId },
    select: {
      id: true,
      name: true,
      createdAt: true,
      lastUsedAt: true,
      isActive: true,
      expiresAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function revokeApiKey(id: string): Promise<{ id: string; isActive: false }> {
  const membership = await requireRole(['admin', 'manager'])
  const existing = await db.apiKey.findFirst({
    where: { id, organizationId: membership.organizationId },
    select: { id: true },
  })
  if (!existing) throw new Error('Clé API introuvable')
  const updated = await db.apiKey.update({
    where: { id: existing.id },
    data: { isActive: false },
    select: { id: true },
  })
  revalidatePath('/parametres/organisation')
  return { id: updated.id, isActive: false }
}

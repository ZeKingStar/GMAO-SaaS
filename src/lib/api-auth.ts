import { createHash } from 'crypto'
import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import type { SubscriptionPlan } from '@/generated/prisma/enums'

export type ApiIdentity = {
  organizationId: string
  keyId: string
}

const ACTIVE_STATUSES = ['active', 'trialing'] as const

export async function validateApiKey(req: NextRequest): Promise<ApiIdentity | null> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const rawKey = authHeader.slice(7).trim()
  if (!rawKey) return null

  const hashedKey = createHash('sha256').update(rawKey).digest('hex')

  const apiKey = await db.apiKey.findUnique({
    where: { hashedKey },
    select: { id: true, organizationId: true, isActive: true, expiresAt: true },
  })

  if (!apiKey || !apiKey.isActive) return null
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null

  return { organizationId: apiKey.organizationId, keyId: apiKey.id }
}

export async function requireApiPlan(
  organizationId: string,
  plans: SubscriptionPlan[]
): Promise<boolean> {
  const sub = await db.subscription.findUnique({
    where: { organizationId },
    select: { plan: true, status: true },
  })
  const effectivePlan: SubscriptionPlan =
    sub && ACTIVE_STATUSES.includes(sub.status as (typeof ACTIVE_STATUSES)[number])
      ? sub.plan
      : 'starter'
  return plans.includes(effectivePlan)
}

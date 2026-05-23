import type { NextRequest } from 'next/server'
import { validateApiKey, requireApiPlan } from '@/lib/api-auth'
import { db } from '@/lib/db'
import { workOrderCreateSchema, paginationSchema } from '@/lib/api-validation'

export const dynamic = 'force-dynamic'

type Identity = NonNullable<Awaited<ReturnType<typeof validateApiKey>>>

async function authenticate(request: NextRequest): Promise<
  | { identity: Identity }
  | { error: Response }
> {
  const identity = await validateApiKey(request)
  if (!identity) {
    return {
      error: Response.json(
        { error: 'Clé API invalide ou manquante' },
        { status: 401, headers: { 'WWW-Authenticate': 'Bearer realm="korvia-api"' } }
      ),
    }
  }
  const allowed = await requireApiPlan(identity.organizationId, ['growth', 'enterprise'])
  if (!allowed) {
    return {
      error: Response.json(
        { error: "Votre forfait ne permet pas l'accès à l'API" },
        { status: 403 }
      ),
    }
  }
  // Fire-and-forget lastUsedAt update — must not block response
  db.apiKey
    .update({
      where: { id: identity.keyId },
      data: { lastUsedAt: new Date() },
    })
    .catch((err) => console.error('[api] failed to update lastUsedAt:', err))
  return { identity }
}

export async function GET(request: NextRequest) {
  const auth = await authenticate(request)
  if ('error' in auth) return auth.error
  const { identity } = auth

  const parsed = paginationSchema.safeParse({
    page: request.nextUrl.searchParams.get('page') ?? undefined,
    limit: request.nextUrl.searchParams.get('limit') ?? undefined,
  })
  if (!parsed.success) {
    return Response.json(
      { error: 'Paramètres de pagination invalides', issues: parsed.error.issues },
      { status: 400 }
    )
  }
  const { page, limit } = parsed.data

  const [workOrders, total] = await Promise.all([
    db.workOrder.findMany({
      where: { organizationId: identity.organizationId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        number: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        type: true,
        siteId: true,
        assetId: true,
        dueDate: true,
        estimatedHours: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    db.workOrder.count({ where: { organizationId: identity.organizationId } }),
  ])

  return Response.json({ data: workOrders, total, page, limit })
}

export async function POST(request: NextRequest) {
  const auth = await authenticate(request)
  if ('error' in auth) return auth.error
  const { identity } = auth

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }
  const parsed = workOrderCreateSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'Validation', issues: parsed.error.issues },
      { status: 400 }
    )
  }
  const data = parsed.data

  // Compute next WO number scoped to org (replicates createWorkOrder logic without Clerk)
  const last = await db.workOrder.findFirst({
    where: { organizationId: identity.organizationId },
    orderBy: { number: 'desc' },
    select: { number: true },
  })
  const number = (last?.number ?? 0) + 1

  const { assigneeIds, dueDate, ...rest } = data
  const wo = await db.workOrder.create({
    data: {
      organizationId: identity.organizationId, // ← from validated identity, NEVER from body
      number,
      ...rest,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      assignees: assigneeIds?.length
        ? { create: assigneeIds.map((membershipId) => ({ membershipId })) }
        : undefined,
    },
    select: {
      id: true,
      number: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      type: true,
      siteId: true,
      assetId: true,
      dueDate: true,
      estimatedHours: true,
      organizationId: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return Response.json(wo, { status: 201 })
}

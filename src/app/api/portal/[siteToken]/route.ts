import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { portalSubmitSchema } from '@/lib/portal-validation'
import { createPortalWorkOrder } from '@/lib/portal-work-order'
import { sendPortalConfirmationEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ siteToken: string }> }
) {
  const { siteToken } = await params

  const site = await db.site.findUnique({
    where: { portalToken: siteToken },
    select: {
      id: true,
      organizationId: true,
      name: true,
      portalEnabled: true,
      organization: { select: { name: true } },
    },
  })
  if (!site || !site.portalEnabled) {
    return Response.json({ error: 'Portail introuvable' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  // Anti-spam: honeypot rempli = bot. Vérifier avant Zod (le schema rejette les valeurs > 0 chars).
  // Réponse 204 silencieuse — pas de signal d'échec pour ne pas révéler la détection.
  const rawBody = body as Record<string, unknown>
  if (typeof rawBody === 'object' && rawBody !== null) {
    const hp = rawBody['honeypot']
    if (typeof hp === 'string' && hp.length > 0) {
      return new Response(null, { status: 204 })
    }
  }

  const parsed = portalSubmitSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'Validation', issues: parsed.error.issues },
      { status: 400 }
    )
  }

  const { honeypot: _honeypot, ...input } = parsed.data

  // organizationId et siteId proviennent de la DB, JAMAIS du body
  const wo = await createPortalWorkOrder({
    organizationId: site.organizationId,
    siteId: site.id,
    input,
  })

  // Fire-and-forget — ne pas bloquer la réponse sur l'envoi email
  sendPortalConfirmationEmail({
    to: input.requesterEmail,
    requesterName: input.requesterName,
    workOrderNumber: wo.number,
    siteName: site.name,
    organizationName: site.organization.name,
  }).catch((err) => {
    console.error('[portal] sendPortalConfirmationEmail failed:', err)
  })

  return Response.json(
    { id: wo.id, number: wo.number, status: wo.status },
    { status: 201 }
  )
}

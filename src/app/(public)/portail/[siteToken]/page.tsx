import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { PortalForm } from './portal-form'

export const dynamic = 'force-dynamic'

export default async function PortalPage({
  params,
}: {
  params: Promise<{ siteToken: string }>
}) {
  const { siteToken } = await params
  const site = await db.site.findUnique({
    where: { portalToken: siteToken },
    select: {
      name: true,
      portalEnabled: true,
      organization: { select: { name: true } },
    },
  })
  if (!site || !site.portalEnabled) notFound()

  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">Demande de maintenance</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {site.organization.name} — {site.name}
        </p>
      </header>
      <PortalForm siteToken={siteToken} />
    </main>
  )
}

import { ApiReference } from '@scalar/nextjs-api-reference'

export const dynamic = 'force-static'

export const GET = ApiReference({
  spec: { url: '/api/openapi.json' },
  theme: 'default',
  metaData: {
    title: 'Korvia API — Documentation',
    description: "Documentation interactive de l'API publique Korvia.",
  },
})

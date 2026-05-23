import { buildOpenApiSpec } from '@/lib/openapi'

export const dynamic = 'force-static'

export async function GET() {
  return Response.json(buildOpenApiSpec())
}

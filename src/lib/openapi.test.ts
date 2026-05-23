/**
 * Unit tests for OpenAPI spec builder — Phase 4 API-03
 *
 * Tests buildOpenApiSpec() generates a valid OpenAPI 3.1 spec from Zod schemas.
 */
import { describe, it, expect } from 'vitest'
import { buildOpenApiSpec } from '@/lib/openapi'

describe('buildOpenApiSpec()', () => {
  it('Test 1: returns an object with openapi === "3.1.0"', () => {
    const spec = buildOpenApiSpec()
    expect(spec.openapi).toBe('3.1.0')
  })

  it('Test 2: info.title === "Korvia API"', () => {
    const spec = buildOpenApiSpec()
    expect(spec.info.title).toBe('Korvia API')
  })

  it('Test 3: paths["/work-orders"] has both "get" and "post" keys', () => {
    const spec = buildOpenApiSpec()
    const paths = spec.paths as Record<string, unknown>
    expect(paths['/work-orders']).toBeDefined()
    const path = paths['/work-orders'] as Record<string, unknown>
    expect(path).toHaveProperty('get')
    expect(path).toHaveProperty('post')
  })

  it('Test 4: paths["/work-orders"].get.responses has keys "200", "401", "403"', () => {
    const spec = buildOpenApiSpec()
    const paths = spec.paths as Record<string, unknown>
    const getOp = (paths['/work-orders'] as Record<string, unknown>).get as Record<
      string,
      unknown
    >
    const responses = getOp.responses as Record<string, unknown>
    expect(responses).toHaveProperty('200')
    expect(responses).toHaveProperty('401')
    expect(responses).toHaveProperty('403')
  })

  it('Test 5: paths["/work-orders"].post.responses has keys "201", "400", "401", "403"', () => {
    const spec = buildOpenApiSpec()
    const paths = spec.paths as Record<string, unknown>
    const postOp = (paths['/work-orders'] as Record<string, unknown>).post as Record<
      string,
      unknown
    >
    const responses = postOp.responses as Record<string, unknown>
    expect(responses).toHaveProperty('201')
    expect(responses).toHaveProperty('400')
    expect(responses).toHaveProperty('401')
    expect(responses).toHaveProperty('403')
  })

  it('Test 6: components.securitySchemes.bearerAuth.scheme === "bearer"', () => {
    const spec = buildOpenApiSpec()
    const components = spec.components as Record<string, unknown>
    const schemes = components.securitySchemes as Record<string, unknown>
    const bearer = schemes.bearerAuth as Record<string, unknown>
    expect(bearer.scheme).toBe('bearer')
  })

  it('Test 7: GET /work-orders path declares security: [{ bearerAuth: [] }]', () => {
    const spec = buildOpenApiSpec()
    const paths = spec.paths as Record<string, unknown>
    const getOp = (paths['/work-orders'] as Record<string, unknown>).get as Record<
      string,
      unknown
    >
    expect(getOp.security).toEqual([{ bearerAuth: [] }])
  })

  it('Test 8: POST /work-orders path declares security: [{ bearerAuth: [] }]', () => {
    const spec = buildOpenApiSpec()
    const paths = spec.paths as Record<string, unknown>
    const postOp = (paths['/work-orders'] as Record<string, unknown>).post as Record<
      string,
      unknown
    >
    expect(postOp.security).toEqual([{ bearerAuth: [] }])
  })
})

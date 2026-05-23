/**
 * OpenAPI 3.1 spec builder for Korvia API
 *
 * Uses @asteasolutions/zod-to-openapi to generate the spec from Zod schemas.
 * NOTE: extendZodWithOpenApi must be called before any schema registration.
 * We define local schemas here to ensure the extension is in effect when
 * schemas are created (ESM import hoisting means module-level schemas from
 * other files may be created before extendZodWithOpenApi runs in this file).
 */
import {
  OpenAPIRegistry,
  OpenApiGeneratorV31,
  extendZodWithOpenApi,
} from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

// Extend Zod BEFORE creating any schemas that will be registered
extendZodWithOpenApi(z)

// WorkOrderCreate schema — mirrors workOrderCreateSchema from api-validation.ts
// Defined locally so extendZodWithOpenApi is in effect when the schema is created
const workOrderCreateSchemaForSpec = z.object({
  title: z.string().min(3).max(200).openapi({ description: 'Titre du bon de travail', example: 'Remplacement filtre HVAC' }),
  description: z.string().max(5000).optional().openapi({ description: 'Description détaillée (optionnel)' }),
  type: z.enum(['corrective', 'preventive', 'inspection', 'other']).openapi({ description: 'Type de bon de travail' }),
  priority: z.enum(['low', 'medium', 'high', 'critical']).openapi({ description: 'Priorité' }),
  siteId: z.string().optional().openapi({ description: 'ID du site (optionnel)' }),
  assetId: z.string().optional().openapi({ description: 'ID de l\'actif (optionnel)' }),
  dueDate: z.string().optional().openapi({ description: 'Date d\'échéance ISO 8601 (optionnel)', example: '2026-06-01T08:00:00Z' }),
  estimatedHours: z.number().positive().max(10000).optional().openapi({ description: 'Heures estimées (optionnel)' }),
  assigneeIds: z.array(z.string()).max(20).optional().openapi({ description: 'IDs des membres assignés (optionnel)' }),
})

// Pagination schema — mirrors paginationSchema from api-validation.ts
const paginationSchemaForSpec = z.object({
  page: z.coerce.number().int().min(1).default(1).openapi({ description: 'Page courante (défaut: 1)', example: 1 }),
  limit: z.coerce.number().int().min(1).default(20).openapi({ description: 'Nombre de résultats par page (max: 100, défaut: 20)', example: 20 }),
})

export function buildOpenApiSpec() {
  const registry = new OpenAPIRegistry()

  registry.registerComponent('securitySchemes', 'bearerAuth', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'krv_<hex>',
    description: 'Clé API Korvia générée depuis /parametres/organisation',
  })

  const WorkOrderCreate = registry.register('WorkOrderCreate', workOrderCreateSchemaForSpec)

  const WorkOrder = registry.register(
    'WorkOrder',
    z.object({
      id: z.string().openapi({ description: 'ID unique du bon de travail' }),
      number: z.number().int().openapi({ description: 'Numéro séquentiel dans l\'organisation' }),
      title: z.string().openapi({ description: 'Titre' }),
      description: z.string().nullable().openapi({ description: 'Description' }),
      status: z.string().openapi({ description: 'Statut: open, in_progress, completed, cancelled' }),
      priority: z.string().openapi({ description: 'Priorité: low, medium, high, critical' }),
      type: z.string().openapi({ description: 'Type: corrective, preventive, inspection, other' }),
      siteId: z.string().nullable().openapi({ description: 'ID du site' }),
      assetId: z.string().nullable().openapi({ description: 'ID de l\'actif' }),
      dueDate: z.string().nullable().openapi({ description: 'Date d\'échéance ISO 8601' }),
      estimatedHours: z.number().nullable().openapi({ description: 'Heures estimées' }),
      createdAt: z.string().openapi({ description: 'Date de création ISO 8601' }),
      updatedAt: z.string().openapi({ description: 'Date de mise à jour ISO 8601' }),
    })
  )

  const ErrorBody = registry.register(
    'Error',
    z.object({
      error: z.string().openapi({ description: 'Message d\'erreur' }),
      issues: z.array(z.any()).optional().openapi({ description: 'Détails de validation (optionnel)' }),
    })
  )

  registry.registerPath({
    method: 'get',
    path: '/work-orders',
    summary: 'Lister les bons de travail',
    description:
      "Retourne la liste paginée des bons de travail de l'organisation associée à la clé API.",
    tags: ['Work Orders'],
    security: [{ bearerAuth: [] }],
    request: { query: paginationSchemaForSpec },
    responses: {
      200: {
        description: 'Liste paginée',
        content: {
          'application/json': {
            schema: z.object({
              data: z.array(WorkOrder),
              total: z.number().int().openapi({ description: 'Nombre total de résultats' }),
              page: z.number().int().openapi({ description: 'Page courante' }),
              limit: z.number().int().openapi({ description: 'Résultats par page' }),
            }),
          },
        },
      },
      401: {
        description: 'Clé API manquante ou invalide',
        content: { 'application/json': { schema: ErrorBody } },
      },
      403: {
        description: 'Forfait insuffisant',
        content: { 'application/json': { schema: ErrorBody } },
      },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/work-orders',
    summary: 'Créer un bon de travail',
    description:
      "Crée un nouveau bon de travail dans l'organisation associée à la clé API.",
    tags: ['Work Orders'],
    security: [{ bearerAuth: [] }],
    request: { body: { content: { 'application/json': { schema: WorkOrderCreate } } } },
    responses: {
      201: {
        description: 'Bon de travail créé',
        content: { 'application/json': { schema: WorkOrder } },
      },
      400: {
        description: 'Corps invalide',
        content: { 'application/json': { schema: ErrorBody } },
      },
      401: {
        description: 'Clé API manquante ou invalide',
        content: { 'application/json': { schema: ErrorBody } },
      },
      403: {
        description: 'Forfait insuffisant',
        content: { 'application/json': { schema: ErrorBody } },
      },
    },
  })

  const generator = new OpenApiGeneratorV31(registry.definitions)
  return generator.generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'Korvia API',
      version: '1.0.0',
      description:
        'API publique Korvia GMAO. Authentification par clé API : header `Authorization: Bearer krv_…`. Forfait Croissance ou Entreprise requis.',
    },
    servers: [{ url: '/api/v1', description: 'Production' }],
  })
}

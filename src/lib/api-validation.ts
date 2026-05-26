import { z } from 'zod'
import { WorkOrderType, WorkOrderPriority } from '@/generated/prisma/enums'

// Pagination shared by GET endpoints
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).default(20).transform((v) => Math.min(v, 100)),
})

export type PaginationInput = z.infer<typeof paginationSchema>

// Body schema for POST /api/v1/work-orders
export const workOrderCreateSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().max(5000).optional(),
  type: z.enum(Object.values(WorkOrderType) as [WorkOrderType, ...WorkOrderType[]]),
  priority: z.enum(Object.values(WorkOrderPriority) as [WorkOrderPriority, ...WorkOrderPriority[]]),
  siteId: z.string().min(1).optional(),
  assetId: z.string().min(1).optional(),
  dueDate: z.iso.datetime().optional(),
  estimatedHours: z.number().positive().max(10000).optional(),
  assigneeIds: z.array(z.string().min(1)).max(20).optional(),
})

export type WorkOrderCreateInput = z.infer<typeof workOrderCreateSchema>

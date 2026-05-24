import { z } from 'zod'

export const portalSubmitSchema = z.object({
  requesterName: z.string().min(1).max(100),
  requesterEmail: z.string().email().max(200),
  description: z.string().min(10).max(1000),
  locationDescription: z.string().max(200).optional(),
  // Honeypot: champ caché dans le formulaire — rempli = bot
  honeypot: z.string().max(0).optional().or(z.literal('')),
})

export type PortalSubmitInput = z.infer<typeof portalSubmitSchema>

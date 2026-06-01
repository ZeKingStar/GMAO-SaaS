import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { db } from "@/lib/db"

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
})

// activeOrganizationId est stocké dans la table Session (colonne DB).
// Better Auth's Prisma adapter retourne toutes les colonnes — on type manuellement.
export type AuthSession = {
  user: { id: string; email: string; name: string; image?: string | null }
  session: { id: string; userId: string; activeOrganizationId?: string | null }
} | null

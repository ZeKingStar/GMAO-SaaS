import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { customSession } from "better-auth/plugins"
import { db } from "@/lib/db"

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  plugins: [
    customSession(async ({ session }) => ({
      activeOrganizationId: (session as Record<string, unknown>).activeOrganizationId as string | null ?? null,
    })),
  ],
})

export type BetterAuthSession = typeof auth.$Infer.Session

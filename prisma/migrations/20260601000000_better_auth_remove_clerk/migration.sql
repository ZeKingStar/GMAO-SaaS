-- Migration: Better Auth — retrait de Clerk
-- Remplace clerkId/clerkUserId par les tables Better Auth
-- Loi 25 / CLOUD Act compliance

-- ─── Better Auth : tables core ───────────────────────────────────────────────

CREATE TABLE "User" (
    "id"            TEXT NOT NULL,
    "name"          TEXT NOT NULL,
    "email"         TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL,
    "image"         TEXT,
    "createdAt"     TIMESTAMP(3) NOT NULL,
    "updatedAt"     TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "Session" (
    "id"                   TEXT NOT NULL,
    "expiresAt"            TIMESTAMP(3) NOT NULL,
    "token"                TEXT NOT NULL,
    "createdAt"            TIMESTAMP(3) NOT NULL,
    "updatedAt"            TIMESTAMP(3) NOT NULL,
    "ipAddress"            TEXT,
    "userAgent"            TEXT,
    "userId"               TEXT NOT NULL,
    "activeOrganizationId" TEXT,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_token_idx" ON "Session"("token");

CREATE TABLE "Account" (
    "id"                    TEXT NOT NULL,
    "accountId"             TEXT NOT NULL,
    "providerId"            TEXT NOT NULL,
    "userId"                TEXT NOT NULL,
    "accessToken"           TEXT,
    "refreshToken"          TEXT,
    "idToken"               TEXT,
    "accessTokenExpiresAt"  TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope"                 TEXT,
    "password"              TEXT,
    "createdAt"             TIMESTAMP(3) NOT NULL,
    "updatedAt"             TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Account_userId_idx" ON "Account"("userId");

CREATE TABLE "Verification" (
    "id"         TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value"      TEXT NOT NULL,
    "expiresAt"  TIMESTAMP(3) NOT NULL,
    "createdAt"  TIMESTAMP(3),
    "updatedAt"  TIMESTAMP(3),
    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Verification_identifier_idx" ON "Verification"("identifier");

-- ─── Better Auth : clés étrangères ───────────────────────────────────────────

ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Session" ADD CONSTRAINT "Session_activeOrganizationId_fkey"
    FOREIGN KEY ("activeOrganizationId") REFERENCES "Organization"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── Organization : retrait de clerkId ───────────────────────────────────────

DROP INDEX IF EXISTS "Organization_clerkId_key";
DROP INDEX IF EXISTS "Organization_clerkId_idx";

ALTER TABLE "Organization" DROP COLUMN IF EXISTS "clerkId";

-- ─── Membership : clerkUserId → userId ───────────────────────────────────────

-- Supprimer l'ancienne contrainte unique et l'index
ALTER TABLE "Membership" DROP CONSTRAINT IF EXISTS "Membership_organizationId_clerkUserId_key";
DROP INDEX IF EXISTS "Membership_clerkUserId_idx";

-- Renommer la colonne
ALTER TABLE "Membership" RENAME COLUMN "clerkUserId" TO "userId";

-- Recréer la contrainte unique et l'index avec le nouveau nom
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_organizationId_userId_key"
    UNIQUE ("organizationId", "userId");

CREATE INDEX "Membership_userId_idx" ON "Membership"("userId");

-- Purger les entrées Clerk (userId = anciens clerkUserId, incompatibles avec Better Auth User)
DELETE FROM "Membership";

-- Ajouter la clé étrangère vers User
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

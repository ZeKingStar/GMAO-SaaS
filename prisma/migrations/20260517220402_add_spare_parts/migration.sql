-- CreateTable
CREATE TABLE "SparePart" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "partNumber" TEXT,
    "description" TEXT,
    "unit" TEXT,
    "quantityOnHand" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quantityMin" DOUBLE PRECISION,
    "unitCost" DOUBLE PRECISION,
    "supplier" TEXT,
    "storageLocation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SparePart_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SparePart_organizationId_idx" ON "SparePart"("organizationId");

-- CreateIndex
CREATE INDEX "SparePart_partNumber_idx" ON "SparePart"("partNumber");

-- AddForeignKey
ALTER TABLE "SparePart" ADD CONSTRAINT "SparePart_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

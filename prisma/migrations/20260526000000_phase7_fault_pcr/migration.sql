-- Phase 7 — Structure P/C/R (Problème / Cause / Remède) pour les codes de panne
-- D-01 : rename faultDescription → faultProblem (préserve les données existantes)
-- D-02 : ajout des champs faultCause et faultRemedy (nullable)

ALTER TABLE "WorkOrder" RENAME COLUMN "faultDescription" TO "faultProblem";
ALTER TABLE "WorkOrder" ADD COLUMN "faultCause" TEXT;
ALTER TABLE "WorkOrder" ADD COLUMN "faultRemedy" TEXT;

-- Add HIS mapping columns for insurance catalog synchronization
ALTER TABLE "insurance_providers"
ADD COLUMN IF NOT EXISTS "hisFinanciadorId" TEXT;

ALTER TABLE "insurance_plans"
ADD COLUMN IF NOT EXISTS "hisPlanId" TEXT;

-- Unique indexes (nullable columns allow multiple NULLs)
CREATE UNIQUE INDEX IF NOT EXISTS "insurance_providers_hisFinanciadorId_key"
ON "insurance_providers"("hisFinanciadorId");

CREATE UNIQUE INDEX IF NOT EXISTS "insurance_plans_hisPlanId_key"
ON "insurance_plans"("hisPlanId");

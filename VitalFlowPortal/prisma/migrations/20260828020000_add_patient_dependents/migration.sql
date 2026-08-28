CREATE TABLE IF NOT EXISTS "dependents" (
    "id" TEXT NOT NULL,
    "principalPatientId" TEXT NOT NULL,
    "tipoDocumentoCodigo" TEXT NOT NULL DEFAULT 'DNI',
    "dni" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "phoneNumber" TEXT,
    "address" TEXT,
    "insuranceProviderId" TEXT,
    "insurancePlanId" TEXT,
    "membershipNumber" TEXT,
    "relationshipDocument" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "dependents_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "dependents_principalPatientId_fkey" FOREIGN KEY ("principalPatientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "dependents_tipoDocumentoCodigo_fkey" FOREIGN KEY ("tipoDocumentoCodigo") REFERENCES "tipo_documento"("codigo") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "dependents_insuranceProviderId_fkey" FOREIGN KEY ("insuranceProviderId") REFERENCES "insurance_providers"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "dependents_insurancePlanId_fkey" FOREIGN KEY ("insurancePlanId") REFERENCES "insurance_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "dependents_principalPatientId_tipoDocumentoCodigo_dni_key"
    ON "dependents"("principalPatientId", "tipoDocumentoCodigo", "dni");

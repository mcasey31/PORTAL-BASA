CREATE TABLE "tipo_documento" (
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "tipo_documento_pkey" PRIMARY KEY ("codigo")
);

INSERT INTO "tipo_documento" ("codigo", "nombre", "orden") VALUES
    ('DNI', 'DNI', 1),
    ('PASAPORTE', 'Pasaporte', 2),
    ('LIBRETA_CIVICA', 'Libreta Civica', 3),
    ('CEDULA_IDENTIDAD', 'Cedula Identidad', 4);

ALTER TABLE "patients" ADD COLUMN "tipoDocumentoCodigo" TEXT NOT NULL DEFAULT 'DNI';
DROP INDEX IF EXISTS "patients_dni_institutionId_key";
CREATE UNIQUE INDEX "patients_tipoDocumentoCodigo_dni_institutionId_key"
    ON "patients"("tipoDocumentoCodigo", "dni", "institutionId");
ALTER TABLE "patients"
    ADD CONSTRAINT "patients_tipoDocumentoCodigo_fkey"
    FOREIGN KEY ("tipoDocumentoCodigo") REFERENCES "tipo_documento"("codigo")
    ON DELETE RESTRICT ON UPDATE CASCADE;
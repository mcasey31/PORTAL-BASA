CREATE TABLE IF NOT EXISTS "sexo" (
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "sexo_pkey" PRIMARY KEY ("codigo")
);

INSERT INTO "sexo" ("codigo", "nombre", "orden") VALUES
    ('M', 'Masculino', 1),
    ('F', 'Femenino', 2),
    ('X', 'X', 3)
ON CONFLICT ("codigo") DO NOTHING;

ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "sexoCodigo" TEXT;
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'patients_sexoCodigo_fkey'
    ) THEN
        ALTER TABLE "patients"
            ADD CONSTRAINT "patients_sexoCodigo_fkey"
            FOREIGN KEY ("sexoCodigo") REFERENCES "sexo"("codigo")
            ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
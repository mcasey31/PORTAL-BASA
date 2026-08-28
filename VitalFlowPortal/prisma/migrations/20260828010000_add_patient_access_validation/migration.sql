ALTER TABLE "User"
    ADD COLUMN IF NOT EXISTS "validado" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "validadoAt" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "terminosAceptados" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "terminosAceptadosAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "pending_registrations" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pending_registrations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "pending_registrations_email_key"
    ON "pending_registrations"("email");

CREATE TABLE IF NOT EXISTS "pending_registrations" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pending_registrations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "pending_registrations_email_key"
    ON "pending_registrations"("email");
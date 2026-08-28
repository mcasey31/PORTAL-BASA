import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "~/server/db";

type RegistrationPayload = {
  tipoDocumento: string;
  dni: string;
  password: string;
  name: string;
  birthDate: string;
  sexoCodigo: string;
  phoneNumber: string;
  address: string;
  city: string;
  postalCode: string;
  insuranceProviderId: string;
  insurancePlanId: string;
  membershipNumber: string;
  username: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string; code?: string };
    const email = (body.email ?? "").trim().toLowerCase();
    const code = (body.code ?? "").trim();
    if (!email || !/^\d{6}$/.test(code)) return NextResponse.json({ error: "Ingresá un código válido." }, { status: 400 });

    const pending = await db.pendingRegistration.findUnique({ where: { email } });
    if (!pending || pending.expiresAt < new Date() || createHash("sha256").update(code).digest("hex") !== pending.tokenHash) {
      return NextResponse.json({ error: "El código es inválido o expiró." }, { status: 400 });
    }

    const payload = pending.payload as unknown as RegistrationPayload;
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) return NextResponse.json({ error: "Ya existe una cuenta con ese email." }, { status: 409 });

    const user = await db.user.create({
      data: { email, username: payload.username, password: payload.password, role: "PATIENT", name: payload.name },
    });
    await db.patient.create({
      data: {
        userId: user.id,
        hisId: null,
        dni: payload.dni,
        tipoDocumentoCodigo: payload.tipoDocumento,
        birthDate: new Date(`${payload.birthDate}T00:00:00`),
        gender: payload.sexoCodigo,
        sexoCodigo: payload.sexoCodigo,
        phoneNumber: payload.phoneNumber || null,
        address: payload.address || null,
        city: payload.city || null,
        postalCode: payload.postalCode || null,
        insuranceProviderId: payload.insuranceProviderId || null,
        insurancePlanId: payload.insurancePlanId || null,
        membershipNumber: payload.membershipNumber || null,
        onboardingCompleted: true,
      },
    });
    await db.pendingRegistration.delete({ where: { email } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[VerifyRegistration]", error);
    return NextResponse.json({ error: "No se pudo verificar el registro." }, { status: 500 });
  }
}
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

    const provider = payload.insuranceProviderId
      ? await db.insuranceProvider.findUnique({ where: { id: payload.insuranceProviderId }, select: { id: true } })
      : null;
    const plan = payload.insurancePlanId
      ? await db.insurancePlan.findFirst({ where: { id: payload.insurancePlanId, insuranceProviderId: provider?.id }, select: { id: true } })
      : null;

    await db.$transaction(async (transaction) => {
      const user = await transaction.user.create({
        data: { email, username: payload.username, password: payload.password, role: "PATIENT", name: payload.name },
      });
      await transaction.patient.create({
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
          insuranceProviderId: provider?.id ?? null,
          insurancePlanId: plan?.id ?? null,
          membershipNumber: payload.membershipNumber || null,
          onboardingCompleted: true,
        },
      });
      await transaction.pendingRegistration.delete({ where: { email } });
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[VerifyRegistration]", error);
    return NextResponse.json({ error: "No se pudo verificar el registro." }, { status: 500 });
  }
}
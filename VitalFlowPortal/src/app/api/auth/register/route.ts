import { NextResponse } from "next/server";

import { db } from "~/server/db";

type RegisterBody = {
  tipoDocumento?: string;
  dni?: string;
  numeroDocumento?: string;
  password?: string;
  name?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  insuranceProviderId?: string;
  insurancePlanId?: string;
  membershipNumber?: string;
};

const passwordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RegisterBody;

    const tipoDocumento = (body.tipoDocumento ?? "DNI").trim().toUpperCase();
    const dni = (body.numeroDocumento ?? body.dni ?? "").trim();
    const password = (body.password ?? "").trim();
    const name = (body.name ?? "").trim();
    const phoneNumber = (body.phoneNumber ?? "").trim();
    const address = (body.address ?? "").trim();
    const city = (body.city ?? "").trim();
    const postalCode = (body.postalCode ?? "").trim();
    const insuranceProviderId = (body.insuranceProviderId ?? "").trim();
    const insurancePlanId = (body.insurancePlanId ?? "").trim();
    const membershipNumber = (body.membershipNumber ?? "").trim();
    const fieldErrors: Record<string, string> = {};

    if (!dni) fieldErrors.numeroDocumento = "Ingresá tu número de documento.";
    else if (tipoDocumento === "DNI" && !/^\d{7,8}$/.test(dni)) fieldErrors.numeroDocumento = "El DNI debe tener entre 7 y 8 dígitos.";

    if (!password) fieldErrors.password = "Ingresá una contraseña.";
    else if (!passwordPattern.test(password)) fieldErrors.password = "La contraseña debe tener 8 caracteres, mayúscula, número y símbolo.";

    if (!name) fieldErrors.name = "Ingresá tu nombre y apellido.";
    if (!address) fieldErrors.address = "Ingresá tu dirección.";
    if (!city) fieldErrors.city = "Seleccioná una ciudad.";
    if (!postalCode) fieldErrors.postalCode = "Ingresá el código postal.";
    if (!insuranceProviderId) fieldErrors.insuranceProviderId = "Seleccioná una obra social o prepaga.";
    if (!insurancePlanId) fieldErrors.insurancePlanId = "Seleccioná un plan.";
    if (!phoneNumber) fieldErrors.phoneNumber = "Ingresá un teléfono válido.";
    else if (phoneNumber.replace(/\D/g, "").length < 8 || phoneNumber.replace(/\D/g, "").length > 12) fieldErrors.phoneNumber = "El teléfono debe tener la longitud correcta para Argentina.";

    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json(
        { message: "Revisá los campos marcados en rojo.", fieldErrors },
        { status: 400 },
      );
    }

    const documentKey = tipoDocumento === "DNI" ? dni : `${tipoDocumento.toLowerCase()}-${dni}`;
    const email = tipoDocumento === "DNI"
      ? `dni-${dni}@pacientes.local`
      : `documento-${documentKey}@pacientes.local`;
    const username = tipoDocumento === "DNI"
      ? `paciente-${dni}`
      : `paciente-${documentKey}`;

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        {
          message: "Ya existe una cuenta para este DNI.",
          fieldErrors: { numeroDocumento: "Ya existe una cuenta para este documento. Usá recuperar contraseña." },
        },
        { status: 409 },
      );
    }

    const user = await db.user.create({
      data: {
        email,
        username,
        password,
        role: "PATIENT",
        name,
      },
    });

    await db.patient.create({
      data: {
        userId: user.id,
        hisId: null,
        dni,
        tipoDocumentoCodigo: tipoDocumento,
        phoneNumber: phoneNumber || null,
        address: address || null,
        city: city || null,
        postalCode: postalCode || null,
        insuranceProviderId: insuranceProviderId || null,
        insurancePlanId: insurancePlanId || null,
        membershipNumber: membershipNumber || null,
        onboardingCompleted: true,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[RegisterPatient]", error);
    return NextResponse.json(
      {
        message: "No se pudo crear la cuenta por un error del servidor.",
        fieldErrors: { general: "No se pudo guardar la cuenta. Revisá la base de datos o los datos enviados." },
      },
      { status: 500 },
    );
  }
}

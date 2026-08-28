import { NextResponse } from "next/server";
import { createHash, randomInt } from "node:crypto";

import { db } from "~/server/db";

type RegisterBody = {
  tipoDocumento?: string;
  dni?: string;
  numeroDocumento?: string;
  password?: string;
  email?: string;
  birthDate?: string;
  sexoCodigo?: string;
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

function getAge(birthDate: string) {
  const birth = new Date(`${birthDate}T00:00:00`);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age -= 1;
  return age;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RegisterBody;

    const tipoDocumento = (body.tipoDocumento ?? "DNI").trim().toUpperCase();
    const dni = (body.numeroDocumento ?? body.dni ?? "").trim();
    const password = (body.password ?? "").trim();
    const email = (body.email ?? "").trim().toLowerCase();
    const birthDate = (body.birthDate ?? "").trim();
    const sexoCodigo = (body.sexoCodigo ?? "").trim().toUpperCase();
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
    if (!email) fieldErrors.email = "Ingresá tu email.";
    else if (!/^\S+@\S+\.\S+$/.test(email)) fieldErrors.email = "Ingresá un email válido.";
    if (!birthDate) fieldErrors.birthDate = "Ingresá tu fecha de nacimiento.";
    else if (Number.isNaN(Date.parse(`${birthDate}T00:00:00`)) || new Date(`${birthDate}T00:00:00`) > new Date()) fieldErrors.birthDate = "Ingresá una fecha de nacimiento válida.";
    else if (getAge(birthDate) < 16) fieldErrors.birthDate = "Al ser menor de edad no es posible crear una cuenta, se debe asociar a una cuenta de padre/madre o tutor.";
    if (!['M', 'F', 'X'].includes(sexoCodigo)) fieldErrors.sexoCodigo = "Seleccioná tu sexo.";
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

    const existingPatient = await db.patient.findFirst({ where: { tipoDocumentoCodigo: tipoDocumento, dni } });
    if (existingPatient) {
      return NextResponse.json({ message: "Ya existe una cuenta para este documento.", fieldErrors: { numeroDocumento: "Ya existe una cuenta para este documento." } }, { status: 409 });
    }

    const code = String(randomInt(100000, 1000000));
    await db.pendingRegistration.upsert({
      where: { email },
      update: {
        tokenHash: createHash("sha256").update(code).digest("hex"),
        payload: { tipoDocumento, dni, password, name, birthDate, sexoCodigo, phoneNumber, address, city, postalCode, insuranceProviderId, insurancePlanId, membershipNumber, username },
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
      create: {
        email,
        tokenHash: createHash("sha256").update(code).digest("hex"),
        payload: { tipoDocumento, dni, password, name, birthDate, sexoCodigo, phoneNumber, address, city, postalCode, insuranceProviderId, insurancePlanId, membershipNumber, username },
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    console.info(`[RegisterPatient] Verification code sent to ${email}`);
    const response: { ok: boolean; verificationRequired: boolean; devVerificationCode?: string } = { ok: true, verificationRequired: true };
    if (process.env.NODE_ENV !== "production") response.devVerificationCode = code;
    return NextResponse.json(response);
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

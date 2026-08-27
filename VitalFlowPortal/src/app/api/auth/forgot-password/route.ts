import { NextResponse } from "next/server";

import { db } from "~/server/db";

const passwordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const resetCodeStore = new Map<
  string,
  {
    code: string;
    email: string;
    dni: string;
    expiresAt: number;
  }
>();

const normalizeEmail = (value: string) => value.trim().toLowerCase();

const maskEmail = (email: string) => {
  const [localPart, domain] = email.split("@");
  if (!domain) return email;
  if (localPart.length <= 2) return `**@${domain}`;
  return `${localPart.slice(0, 2)}***@${domain}`;
};

const getUserEmailByDni = (dni: string) => `dni-${dni}@pacientes.local`;

type ForgotPasswordBody = {
  action?: "request" | "reset";
  dni?: string;
  email?: string;
  code?: string;
  newPassword?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ForgotPasswordBody;
    const action = body.action ?? "request";
    const dni = (body.dni ?? "").trim();
    const email = normalizeEmail(body.email ?? "");
    const code = (body.code ?? "").trim();
    const newPassword = (body.newPassword ?? "").trim();

    if (!dni) {
      return NextResponse.json(
        { error: "El DNI es obligatorio" },
        { status: 400 },
      );
    }

    const expectedEmail = getUserEmailByDni(dni);
    const user = await db.user.findUnique({ where: { email: expectedEmail } });

    if (!user) {
      return NextResponse.json(
        { error: "No existe una cuenta para ese DNI" },
        { status: 404 },
      );
    }

    if (action === "request") {
      if (!email) {
        return NextResponse.json(
          { error: "El correo electronico es obligatorio" },
          { status: 400 },
        );
      }

      const requestKey = `${dni}:${email}`;
      const generatedCode = String(Math.floor(100000 + Math.random() * 900000));

      resetCodeStore.set(requestKey, {
        code: generatedCode,
        email,
        dni,
        expiresAt: Date.now() + 10 * 60 * 1000,
      });

      return NextResponse.json({
        ok: true,
        maskedEmail: maskEmail(email),
        demoCode: generatedCode,
      });
    }

    if (action === "reset") {
      if (!email || !code || !newPassword) {
        return NextResponse.json(
          { error: "Faltan datos para restablecer la contrasena" },
          { status: 400 },
        );
      }

      if (!passwordPattern.test(newPassword)) {
        return NextResponse.json(
          { error: "La contrasena debe tener 8 caracteres, una mayuscula, un numero y un simbolo" },
          { status: 400 },
        );
      }

      const requestKey = `${dni}:${email}`;
      const storedCode = resetCodeStore.get(requestKey);

      if (!storedCode) {
        return NextResponse.json(
          { error: "No hay un codigo activo para este DNI y correo" },
          { status: 400 },
        );
      }

      if (Date.now() > storedCode.expiresAt) {
        resetCodeStore.delete(requestKey);
        return NextResponse.json(
          { error: "El codigo expiro. Solicitá uno nuevo" },
          { status: 400 },
        );
      }

      if (storedCode.code !== code) {
        return NextResponse.json(
          { error: "El codigo de verificacion es incorrecto" },
          { status: 400 },
        );
      }

      await db.user.update({
        where: { id: user.id },
        data: { password: newPassword },
      });

      resetCodeStore.delete(requestKey);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      { error: "Accion no valida" },
      { status: 400 },
    );
  } catch (error) {
    console.error("[ForgotPassword]", error);
    return NextResponse.json(
      { error: "No se pudo procesar la solicitud" },
      { status: 500 },
    );
  }
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, KeyRound, Loader2, Mail } from "lucide-react";

const passwordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export default function ForgotPasswordPage() {
  const [dni, setDni] = useState("");
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [codeHint, setCodeHint] = useState("");

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!dni.trim() || !email.trim()) {
      setError("Completá DNI y correo electronico.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request", dni, email }),
      });

      const data = (await res.json()) as { error?: string; demoCode?: string; maskedEmail?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "No se pudo enviar el codigo");
      }

      setCodeSent(true);
      setCodeHint(data.demoCode ? `Codigo de prueba: ${data.demoCode}.` : `Se envio un codigo a ${data.maskedEmail ?? email}.`);
      setSuccess("Te enviamos un codigo de verificacion a tu correo.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar el codigo");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!verificationCode.trim() || verificationCode.trim().length < 6) {
      setError("Ingresá el codigo de verificacion de 6 digitos.");
      return;
    }

    if (!passwordPattern.test(newPassword)) {
      setError("La contrasena debe tener 8 caracteres, una mayuscula, un numero y un simbolo.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contrasenas no coinciden.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset",
          dni,
          email,
          code: verificationCode,
          newPassword,
        }),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "No se pudo restablecer la contrasena");
      }

      setSuccess("Contrasena actualizada correctamente. Ya podés iniciar sesion.");
      setVerificationCode("");
      setNewPassword("");
      setConfirmPassword("");
      setCodeSent(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar la contrasena");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto w-full max-w-[460px] rounded-[2rem] border border-slate-100 bg-white p-5 shadow-xl sm:p-8 md:p-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-200">
            <Mail className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Recuperar contrasena</h1>
          <p className="mt-2 text-sm text-slate-600">Ingresá tu DNI y te enviaremos un codigo para crear una nueva contraseña.</p>
        </div>

        {!codeSent ? (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600">DNI</label>
              <input
                className="w-full rounded-xl border border-slate-200 px-4 py-3"
                value={dni}
                onChange={(e) => setDni(e.target.value.replace(/\D/g, "").slice(0, 8))}
                placeholder="Ej: 12345678"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600">Correo electronico</label>
              <input
                type="email"
                className="w-full rounded-xl border border-slate-200 px-4 py-3"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tuemail@ejemplo.com"
                required
              />
            </div>

            {error && <p className="text-sm font-bold text-red-600">{error}</p>}
            {success && <p className="text-sm font-bold text-emerald-600">{success}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-sm font-black uppercase tracking-widest text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Enviando..." : "Enviar codigo"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="h-4 w-4" />
                Codigo enviado
              </div>
              <p className="mt-1 text-xs">{codeHint}</p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600">Codigo de verificacion</label>
              <input
                className="w-full rounded-xl border border-slate-200 px-4 py-3"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600">Nueva contrasena</label>
              <input
                type="password"
                className="w-full rounded-xl border border-slate-200 px-4 py-3"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimo 8 caracteres"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600">Confirmar contrasena</label>
              <input
                type="password"
                className="w-full rounded-xl border border-slate-200 px-4 py-3"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {error && <p className="text-sm font-bold text-red-600">{error}</p>}
            {success && <p className="text-sm font-bold text-emerald-600">{success}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-sm font-black uppercase tracking-widest text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Actualizando..." : "Actualizar contrasena"}
            </button>

            <button
              type="button"
              onClick={() => {
                setError("");
                setSuccess("");
                setCodeSent(false);
                setVerificationCode("");
                setNewPassword("");
                setConfirmPassword("");
              }}
              className="w-full text-center text-xs font-bold uppercase tracking-wide text-slate-500 hover:text-blue-700"
            >
              Modificar correo
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link href="/auth/signin" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 hover:text-blue-700">
            <ArrowLeft className="h-4 w-4" />
            Volver al ingreso
          </Link>
        </div>
      </div>
    </main>
  );
}

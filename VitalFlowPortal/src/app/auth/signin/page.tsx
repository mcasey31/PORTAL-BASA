"use client";

import { signIn } from "next-auth/react";
import { ArrowLeft, ShieldCheck, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

function BasaBrandMark() {
  return (
    <div className="flex justify-center">
      <img
        src="https://redbasa.com.ar/wp-content/uploads/2025/12/logo-redbasa-color-200x60-1.png"
        alt="RED BASA"
        className="h-10 w-auto max-w-full object-contain sm:h-12"
      />
    </div>
  );
}

export default function PatientSignInPage() {
  const [dni, setDni] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDniLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("paciente-dni", {
        dni: dni.trim(),
        password,
        redirect: false
      });

      if (result?.error) {
        setError("DNI o datos inválidos");
      } else if (result?.ok) {
        window.location.href = "/dashboard";
      }
    } catch (err) {
      setError("Error al intentar ingresar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-50 rounded-full blur-[120px] opacity-60 -mr-40 -mt-40"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-50 rounded-full blur-[100px] opacity-40 -ml-20 -mb-20"></div>

      <div className="relative w-full max-w-[430px] animate-in fade-in slide-in-from-bottom-8 duration-700 md:max-w-[500px]">
        <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 p-5 sm:p-8 md:p-10 border border-white relative overflow-hidden text-center">
          
          {/* Logo y Header */}
          <div className="mb-10 flex flex-col items-center">
            <div className="mb-5 w-full">
              <BasaBrandMark />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Bienvenido al <br/><span className="text-blue-600">Portal de Pacientes</span></h1>
            <p className="text-slate-500 text-sm font-medium mt-4">Gestiona tu salud de forma autónoma y segura.</p>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-indigo-100 bg-indigo-50/40 p-4 text-left">
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-700 sm:text-xs">ACCESO EXCLUSIVO A PACIENTES</p>
            </div>

            <form onSubmit={handleDniLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">DNI</label>
                <input
                  type="text"
                  placeholder="Ej: 12345678"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Ingresá tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-3 pr-11 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-700"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && <p className="text-sm text-red-500 font-bold">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-black text-sm uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Ingresando..." : "INGRESAR"}
              </button>

              <div className="pt-2 space-y-2 text-center">
                <p className="text-xs text-slate-600">
                  No tenes cuenta?{" "}
                  <Link href="/auth/signup" className="font-black text-blue-700 hover:text-blue-900 uppercase tracking-wide">
                    Creala
                  </Link>
                </p>
                <p className="text-xs text-slate-500">
                  <Link href="/auth/forgot-password" className="font-bold hover:text-blue-700 transition-colors">
                    Olvide mi contrasena
                  </Link>
                </p>
              </div>
            </form>

          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-10 flex flex-col items-center gap-6 text-slate-400">
            <div className="flex items-center gap-8">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-tighter">HIPAA Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-tighter">Secure Auth</span>
                </div>
            </div>

            <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors text-xs font-bold uppercase tracking-widest">
                <ArrowLeft className="h-4 w-4" />
                Volver a la landing
            </Link>
        </div>
      </div>
    </main>
  );
}

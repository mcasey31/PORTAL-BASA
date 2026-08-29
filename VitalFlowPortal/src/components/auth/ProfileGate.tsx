"use client";

import { signOut, useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "~/trpc/react";
import { Loader2, HeartPulse } from "lucide-react";

export function ProfileGate({ children }: { children: React.ReactNode }) {
    const { status } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);
    const [validationFinished, setValidationFinished] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [termsScrolled, setTermsScrolled] = useState(false);
    const [termsDeclined, setTermsDeclined] = useState(false);
    const validationStarted = useRef(false);
    const safePathname = pathname ?? "";

    useEffect(() => {
        setMounted(true);
    }, []);
    
    const { data: patient, isLoading } = api.patient.getOnboardingStatus.useQuery(undefined, {
        enabled: status === "authenticated",
        // Evitamos refetch constantes mientras estamos en onboarding
        staleTime: Infinity, 
    });
    const { data: accessStatus, isLoading: accessLoading } = api.patient.getAccessStatus.useQuery(undefined, {
        enabled: status === "authenticated",
        staleTime: Infinity,
    });
    const validateNetworkAttendance = api.patient.validateNetworkAttendance.useMutation();
    const acceptTerms = api.patient.acceptTerms.useMutation();

    // Rutas que no deben ser procesadas por la lógica de pacientes (públicas, staff o admin)
    const isExcludedRoute = 
        safePathname === "/" || 
        safePathname === "/landing" ||
        safePathname === "/corporate" ||
        safePathname === "/quantum-home" ||
        safePathname.startsWith("/auth") || 
        safePathname.startsWith("/staff") || 
        safePathname.startsWith("/admin");

    useEffect(() => {
        if (!mounted) return;

        if (status === "unauthenticated" && !isExcludedRoute) {
            router.push("/auth/signin");
            return;
        }

        if (patient && !patient.onboardingCompleted && safePathname !== "/onboarding" && !isExcludedRoute) {
            router.push("/onboarding");
        }
        
        if (patient?.onboardingCompleted && safePathname === "/onboarding") {
            router.push("/dashboard");
        }
    }, [status, patient, safePathname, router, isExcludedRoute, mounted]);

    useEffect(() => {
        if (!mounted || status !== "authenticated" || isExcludedRoute || accessLoading || !accessStatus || validationStarted.current) return;
        if (accessStatus.validadoAt || validationFinished) return;

        validationStarted.current = true;
        validateNetworkAttendance.mutate(undefined, {
            onSuccess: () => setValidationFinished(true),
            onError: () => setValidationFinished(true),
        });
    }, [accessLoading, accessStatus, isExcludedRoute, mounted, status, validationFinished, validateNetworkAttendance]);

    // Si no está montado, devolvemos nada para evitar el Hydration Mismatch
    if (!mounted) return null;

    // Solo mostramos el cargador de pantalla completa si NO es una ruta excluida
    // y la sesión o los datos están cargando.
    if (!isExcludedRoute && (status === "loading" || (status === "authenticated" && (isLoading || accessLoading)))) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 gap-5">
                <div className="flex items-center justify-center rounded-full border border-blue-100 bg-white px-3 py-2 shadow-sm shadow-blue-100/80">
                    <img
                        src="https://redbasa.com.ar/wp-content/uploads/2025/12/logo-redbasa-color-200x60-1.png"
                        alt="RED BASA"
                        className="h-8 w-auto object-contain"
                    />
                </div>
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-5 w-5 text-slate-400 animate-spin" />
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Autenticando Acceso</p>
                </div>
            </div>
        );
    }

    const shouldValidate = status === "authenticated" && !isExcludedRoute && accessStatus && !accessStatus.validadoAt && !validationFinished;
    const shouldShowTerms = status === "authenticated" && !isExcludedRoute && (validationFinished || Boolean(accessStatus?.validadoAt)) && !accessStatus?.terminosAceptados && !termsAccepted;

    if (shouldValidate || validateNetworkAttendance.isPending) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#173b5d] text-white gap-6">
                <img
                    src="https://redbasa.com.ar/wp-content/uploads/2019/12/logo-redbasa-color-260x78.png"
                    alt="RED BASA"
                    className="h-auto w-[min(72vw,22rem)] object-contain"
                />
                <Loader2 className="h-8 w-8 animate-spin text-cyan-200" />
                <p className="text-center text-sm font-bold uppercase tracking-[0.16em] text-white/90">Validando últimas atenciones en la red</p>
            </div>
        );
    }

    if (termsDeclined) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-slate-50 p-6">
                <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-xl">
                    <h2 className="text-2xl font-black text-slate-900">Acceso no habilitado</h2>
                    <p className="mt-4 text-sm leading-relaxed text-slate-600">Al no aceptar los Términos y Condiciones, las funciones de este portal de información de habeas data serán denegadas.</p>
                    <button type="button" onClick={() => signOut({ callbackUrl: "/auth/signin" })} className="mt-6 rounded-xl bg-slate-900 px-5 py-3 text-xs font-black uppercase tracking-widest text-white">Volver al inicio</button>
                </div>
            </div>
        );
    }

    if (shouldShowTerms) {
        return (
            <TermsModal
                termsScrolled={termsScrolled}
                onScroll={() => setTermsScrolled(true)}
                onDecline={() => setTermsDeclined(true)}
                onAccept={() => acceptTerms.mutate(undefined, { onSuccess: () => setTermsAccepted(true) })}
                accepting={acceptTerms.isPending}
            />
        );
    }

    return <>{children}</>;
}

function TermsModal({
    termsScrolled,
    onScroll,
    onDecline,
    onAccept,
    accepting,
}: {
    termsScrolled: boolean;
    onScroll: () => void;
    onDecline: () => void;
    onAccept: () => void;
    accepting: boolean;
}) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0b2e4d]/75 p-4 backdrop-blur-sm">
            <section className="flex max-h-[min(90vh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="terms-title">
                <div className="border-b border-slate-100 px-6 py-5 text-center sm:px-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#28716e]">RED BASA</p>
                    <h2 id="terms-title" className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">Aceptación de Términos y Condiciones</h2>
                    <p className="mt-2 text-sm text-slate-500">Leé el contenido completo para continuar.</p>
                </div>
                <div onScroll={(event) => { const element = event.currentTarget; if (element.scrollTop + element.clientHeight >= element.scrollHeight - 12) onScroll(); }} className="min-h-0 flex-1 overflow-y-auto px-6 py-6 text-sm leading-7 text-slate-600 sm:px-10">
                    <h3 className="font-bold text-slate-900">1. Uso del portal</h3>
                    <p className="mt-2">Este portal permite consultar información personal de salud, gestionar turnos y acceder a documentos disponibles en la Red BASA.</p>
                    <h3 className="mt-6 font-bold text-slate-900">2. Protección de datos</h3>
                    <p className="mt-2">La información será tratada de forma confidencial y utilizada para brindar los servicios solicitados, conforme a la normativa vigente de protección de datos personales y habeas data.</p>
                    <h3 className="mt-6 font-bold text-slate-900">3. Responsabilidad</h3>
                    <p className="mt-2">El paciente debe mantener sus credenciales en reserva y utilizar información verdadera. La disponibilidad de cada función puede depender de la integración con los sistemas de la red.</p>
                    <h3 className="mt-6 font-bold text-slate-900">4. Aceptación</h3>
                    <p className="mt-2">Al aceptar, confirmás que leíste este texto de ejemplo y autorizás el uso del portal bajo estas condiciones. Este contenido será reemplazado por los términos legales definitivos.</p>
                    <div className="h-4" />
                </div>
                <div className="border-t border-slate-100 px-6 py-5 sm:px-10">
                    <p className="mb-4 text-center text-xs font-bold text-slate-500">{termsScrolled ? "Ya podés elegir una opción." : "Desplazate hasta el final para habilitar la aceptación."}</p>
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
                        <button type="button" onClick={onDecline} className="rounded-xl border border-slate-200 px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-600">No estoy de acuerdo</button>
                        <button type="button" onClick={onAccept} disabled={!termsScrolled || accepting} className="rounded-xl bg-[#28716e] px-5 py-3 text-xs font-black uppercase tracking-widest text-white disabled:cursor-not-allowed disabled:bg-slate-300">{accepting ? "Confirmando..." : "De acuerdo y confirmar"}</button>
                    </div>
                </div>
            </section>
        </div>
    );
}

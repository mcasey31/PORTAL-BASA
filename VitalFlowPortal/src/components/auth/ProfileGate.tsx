"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import { Loader2, HeartPulse } from "lucide-react";

export function ProfileGate({ children }: { children: React.ReactNode }) {
    const { status } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);
    const safePathname = pathname ?? "";

    useEffect(() => {
        setMounted(true);
    }, []);
    
    const { data: patient, isLoading } = api.patient.getOnboardingStatus.useQuery(undefined, {
        enabled: status === "authenticated",
        // Evitamos refetch constantes mientras estamos en onboarding
        staleTime: Infinity, 
    });

    // Rutas que no deben ser procesadas por la lógica de pacientes (públicas, staff o admin)
    const isExcludedRoute = 
        safePathname === "/" || 
        safePathname === "/landing" ||
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

    // Si no está montado, devolvemos nada para evitar el Hydration Mismatch
    if (!mounted) return null;

    // Solo mostramos el cargador de pantalla completa si NO es una ruta excluida
    // y la sesión o los datos están cargando.
    if (!isExcludedRoute && (status === "loading" || (status === "authenticated" && isLoading))) {
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

    return <>{children}</>;
}

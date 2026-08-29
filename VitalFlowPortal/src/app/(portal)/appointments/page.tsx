"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "~/trpc/react";
import { Badge } from "~/components/ui/badge";
import { 
    Calendar, 
    Clock, 
    MapPin, 
    User,
    Loader2,
    CalendarPlus,
    Video,
    X,
    CircleCheck,
    CircleX,
    UserX
} from "lucide-react";
  import { format, differenceInMinutes } from "date-fns";
import { es } from "date-fns/locale";
import { NewAppointmentFlow } from "./_components/NewAppointmentFlow";

export default function AppointmentsPage() {
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
    const utils = api.useUtils();
    const { data: appointments, isLoading } = api.health.getAppointments.useQuery();
    const cancelMutation = api.health.cancelarTurno.useMutation({
        onSuccess: () => {
            setCancelConfirmId(null);
            void utils.health.getAppointments.invalidate();
        },
    });
    const [currentTime, setCurrentTime] = useState(new Date());

    const turnoParaCancelar = cancelConfirmId
        ? appointments?.future?.find(a => a.id === cancelConfirmId)
        : null;

    // Actualizar el reloj para la lógica de los 15 minutos
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in slide-in-from-right-2 duration-700">
            <NewAppointmentFlow 
                isOpen={isRequestModalOpen} 
                onClose={() => setIsRequestModalOpen(false)} 
            />

            {/* MODAL CONFIRMAR CANCELACIÓN */}
            {cancelConfirmId && turnoParaCancelar && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <h3 className="font-black text-lg text-slate-900 mb-1">Cancelar turno</h3>
                        <p className="text-sm text-slate-500 mb-4">¿Confirmas que querés cancelar este turno?</p>
                        <div className="text-sm space-y-1 mb-5 bg-slate-50 rounded-xl p-3">
                            <p><span className="font-bold text-slate-600">Especialidad:</span> {turnoParaCancelar.professional.specialty}</p>
                            <p><span className="font-bold text-slate-600">Profesional:</span> {turnoParaCancelar.professional.name}</p>
                            <p><span className="font-bold text-slate-600">Fecha:</span> {format(new Date(turnoParaCancelar.start), "d 'de' MMMM, HH:mm", { locale: es })}</p>
                        </div>
                        <p className="text-xs text-red-500 mb-4">Esta acción no se puede deshacer.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setCancelConfirmId(null)}
                                className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
                                disabled={cancelMutation.isPending}
                            >
                                Volver
                            </button>
                            <button
                                onClick={() => cancelMutation.mutate({ turnoId: cancelConfirmId })}
                                className="flex-1 bg-red-600 text-white py-2 rounded-xl text-sm font-black hover:bg-red-700 transition-all disabled:opacity-50"
                                disabled={cancelMutation.isPending}
                            >
                                {cancelMutation.isPending ? "Cancelando..." : "Sí, cancelar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-slate-950 uppercase italic tracking-tighter">Mis Turnos</h2>
                    <p className="text-slate-500 mt-1 font-bold text-sm">Tus citas médicas confirmadas.</p>
                </div>
                <button 
                    onClick={() => setIsRequestModalOpen(true)}
                    className="bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-widest transition-all shadow-2xl shadow-slate-900/10 active:scale-95"
                >
                    <CalendarPlus className="h-4 w-4" />
                    Solicitar Nuevo Turno
                </button>
            </div>

            <div className="space-y-10">
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <div><h3 className="text-xl font-black uppercase text-slate-950">Próximos turnos</h3><p className="mt-1 text-sm text-slate-500">Gestioná tus citas próximas.</p></div>
                  <Badge className="bg-slate-900 text-white">{appointments?.future?.length ?? 0}</Badge>
                </div>
                {appointments?.future?.length ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {appointments.future.map((apt) => {
                      const aptDate = new Date(apt.start);
                      const minutesDiff = differenceInMinutes(aptDate, currentTime);
                      const canJoin = minutesDiff <= 15 && minutesDiff >= -30;
                      return <article key={apt.id} className="border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center bg-blue-50 text-blue-600"><Calendar className="h-5 w-5" /></div><div><p className="font-black text-slate-950">{format(aptDate, "d 'de' MMMM", { locale: es })}</p><p className="text-sm text-slate-500">{format(aptDate, "HH:mm")} hs</p></div></div><Badge className="bg-emerald-50 text-emerald-700">Confirmado</Badge></div>
                        <div className="mt-5 border-y border-slate-100 py-4"><p className="font-bold text-slate-900">{apt.professional.specialty}</p><p className="mt-1 flex items-center gap-2 text-sm text-slate-600"><User className="h-4 w-4 text-slate-400" />{apt.professional.name}</p><p className="mt-2 flex items-center gap-2 text-sm text-slate-500"><MapPin className="h-4 w-4 text-slate-400" />{apt.facility.name}</p></div>
                        <div className="mt-4 flex gap-2">{canJoin && <Link href="/telemedicine" className="flex flex-1 items-center justify-center gap-2 bg-slate-900 py-2.5 text-xs font-black uppercase tracking-wider text-white"><Video className="h-4 w-4" />Ingresar</Link>}<button onClick={() => setCancelConfirmId(apt.id)} className="flex flex-1 items-center justify-center gap-2 border border-red-200 py-2.5 text-xs font-black uppercase tracking-wider text-red-600 hover:bg-red-50"><X className="h-4 w-4" />Cancelar</button></div>
                      </article>;
                    })}
                  </div>
                ) : <div className="border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center"><Calendar className="mx-auto mb-3 h-10 w-10 text-slate-300" /><p className="font-bold text-slate-600">No tenés turnos próximos.</p><button onClick={() => setIsRequestModalOpen(true)} className="mt-4 bg-slate-900 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white">Solicitar turno</button></div>}
              </section>

              <section>
                <div className="mb-4"><h3 className="text-xl font-black uppercase text-slate-950">Historial de turnos</h3><p className="mt-1 text-sm text-slate-500">Turnos consumidos, anulados y no tomados.</p></div>
                {appointments?.past?.length ? <div className="divide-y border border-slate-200 bg-white">{appointments.past.map((apt) => {
                  const aptDate = new Date(apt.start);
                  const status = apt.status === "completed" ? { label: "Consumido", className: "bg-emerald-50 text-emerald-700", icon: CircleCheck } : apt.status === "cancelled" ? { label: "Anulado", className: "bg-red-50 text-red-700", icon: CircleX } : { label: "No tomado", className: "bg-amber-50 text-amber-700", icon: UserX };
                  const StatusIcon = status.icon;
                  return <div key={apt.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="font-bold text-slate-900">{apt.professional.specialty}</p><p className="mt-1 truncate text-sm text-slate-600">{apt.professional.name} · {apt.facility.name}</p></div><div className="flex items-center gap-4 sm:justify-end"><p className="text-sm font-medium text-slate-500">{format(aptDate, "d MMM yyyy, HH:mm", { locale: es })}</p><Badge className={`flex items-center gap-1.5 ${status.className}`}><StatusIcon className="h-3.5 w-3.5" />{status.label}</Badge></div></div>;
                })}</div> : <div className="border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center"><Clock className="mx-auto mb-3 h-9 w-9 text-slate-300" /><p className="font-bold text-slate-600">Todavía no hay turnos en tu historial.</p></div>}
              </section>
            </div>
            
            <div className="p-6 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/20">
                    <Calendar className="h-5 w-5 text-white" />
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-medium pt-1">
                    <span className="font-bold text-blue-600 uppercase tracking-widest text-[10px] block mb-1">Información importante</span>
                    Recuerda presentarte 15 minutos antes de tu cita con tu credencial y documento. Los turnos cancelados con menos de 24hs podrían estar sujetos a re-agenda administrativa.
                </p>
            </div>
        </div>
    );
}


"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "~/trpc/react";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { 
    Calendar, 
    Clock, 
    MapPin, 
    User,
    Loader2,
    CalendarPlus,
    Video,
    X
} from "lucide-react";
import { format, differenceInMinutes, isBefore, isAfter, addMinutes } from "date-fns";
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

            {!appointments || (appointments.future?.length === 0 && appointments.past?.length === 0) ? (
              <div className="p-12 text-center bg-slate-50/50 border border-slate-200 rounded-3xl">
                <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 font-bold mb-4">No tienes turnos reservados</p>
                <button 
                  onClick={() => setIsRequestModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl text-sm font-black uppercase transition-all"
                >
                  Solicitar tu primer turno
                </button>
              </div>
            ) : (
              <div className="space-y-10">
                {/* PRÓXIMOS TURNOS */}
                {appointments.future && appointments.future.length > 0 && (
                  <div>
                    <h3 className="text-xl font-black text-slate-950 mb-4 uppercase">📅 Próximos Turnos</h3>
                    <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50">
                      <Table>
                        <TableHeader className="bg-slate-50/50">
                          <TableRow className="border-slate-100 hover:bg-transparent">
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-5 pl-8">Fecha y Hora</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo / Especialidad</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Profesional</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Centro / Consultorio</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 pr-8 text-right">Estado</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {appointments.future.map((apt) => {
                            const aptDate = new Date(apt.start);
                            const minutesDiff = differenceInMinutes(aptDate, currentTime);
                            const canJoin = minutesDiff <= 15 && minutesDiff >= -30;

                            return (
                              <TableRow key={apt.id} className="border-slate-50 hover:bg-blue-50/30 transition-colors">
                                <TableCell className="py-6 pl-8">
                                  <div className="flex flex-col">
                                    <span className="font-bold text-slate-900">
                                      {format(aptDate, "d 'de' MMMM", { locale: es })}
                                    </span>
                                    <span className="text-xs text-slate-400 flex items-center gap-1 mt-1 font-medium">
                                      <Clock className="h-3 w-3" />
                                      {format(aptDate, "hh:mm aa")}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm font-bold text-slate-700">{apt.professional.specialty}</span>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 overflow-hidden">
                                      <img src={`https://i.pravatar.cc/100?u=${apt.id}`} alt="doc" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-700">{apt.professional.name}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                                    <MapPin className="h-3.5 w-3.5 text-blue-500/40" />
                                    <span>{apt.facility.name}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="pr-8 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    {canJoin ? (
                                      <Link 
                                        href="/telemedicine"
                                        className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 animate-bounce"
                                      >
                                        <Video className="w-3 h-3" /> Ingresar
                                      </Link>
                                    ) : (
                                      <Badge className="bg-green-50 text-green-700 border border-green-200 rounded-md px-3 py-1 text-[9px] font-black uppercase tracking-tighter shadow-none">
                                        ✓ Confirmado
                                      </Badge>
                                    )}
                                    <button
                                      onClick={() => setCancelConfirmId(apt.id)}
                                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-red-600 hover:bg-red-50 transition-all"
                                      title="Cancelar turno"
                                    >
                                      <X className="w-3.5 h-3.5" /> Cancelar
                                    </button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {/* HISTORIAL */}
                {appointments.past && appointments.past.length > 0 && (
                  <div>
                    <h3 className="text-xl font-black text-slate-950 mb-4 uppercase">📋 Historial de Turnos</h3>
                    <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50">
                      <Table>
                        <TableHeader className="bg-slate-50/50">
                          <TableRow className="border-slate-100 hover:bg-transparent">
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-5 pl-8">Fecha y Hora</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo / Especialidad</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Profesional</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Centro / Consultorio</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 pr-8 text-right">Estado</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {appointments.past.map((apt) => {
                            const aptDate = new Date(apt.start);
                            return (
                              <TableRow key={apt.id} className="border-slate-50 hover:bg-slate-50/30 transition-colors opacity-75">
                                <TableCell className="py-6 pl-8">
                                  <div className="flex flex-col">
                                    <span className="font-bold text-slate-700">
                                      {format(aptDate, "d 'de' MMMM", { locale: es })}
                                    </span>
                                    <span className="text-xs text-slate-400 flex items-center gap-1 mt-1 font-medium">
                                      <Clock className="h-3 w-3" />
                                      {format(aptDate, "hh:mm aa")}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm font-bold text-slate-700">{apt.professional.specialty}</span>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm text-slate-700">{apt.professional.name}</span>
                                </TableCell>
                                <TableCell>
                                  <span className="text-xs text-slate-500">{apt.facility.name}</span>
                                </TableCell>
                                <TableCell className="pr-8 text-right">
                                  <Badge className={`
                                    ${apt.status === 'completed' ? 'bg-slate-50 text-slate-600 border-slate-200' : ''}
                                    ${apt.status === 'cancelled' ? 'bg-red-50 text-red-600 border-red-200' : ''}
                                    rounded-md px-3 py-1 text-[9px] font-black uppercase tracking-tighter border shadow-none
                                  `}>
                                    {apt.status === 'completed' ? '✓ Completado' : apt.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            )}
            
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


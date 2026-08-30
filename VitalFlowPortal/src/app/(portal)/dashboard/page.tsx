"use client";

import { 
  Calendar, 
  MessageSquare, 
  Bell, 
  ArrowRight,
  Video,
  FileText,
  Loader2,
  Pill,
} from "lucide-react";
import Link from "next/link";
import { api } from "~/trpc/react";
import { useSession } from "next-auth/react";
import { PLATFORM_CONFIG } from "~/config/platform";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { ReactNode } from "react";

export default function DashboardPage() {
  const { data: session } = useSession();
  const { data: appointments, isLoading: isLoadingAppointments } = api.health.getAppointments.useQuery();
  const { data: studies, isLoading: isLoadingStudies } = api.health.getMedicalHistory.useQuery();
  const pendingAppointments = appointments?.future
    .filter((appointment) => appointment.status === "pending")
    .sort((first, second) => new Date(first.start).getTime() - new Date(second.start).getTime())
    .slice(0, 2) ?? [];
  
  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-12">
      {/* Header de Bienvenida Premium & Branding Dinámico */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-1 w-8 bg-slate-900"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Portal Exclusivo</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-slate-900 tracking-tight font-outfit uppercase">
            {session?.user?.name?.split(' ')[0] || 'Paciente'}, Bienvenido
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1 font-medium">{PLATFORM_CONFIG.institutionName} • Mi Salud Online</p>
        </div>
        <div className="flex gap-3">
          <Link 
            href="/appointments" 
            className="px-8 py-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-xl hover:shadow-red-600/20 active:scale-95 text-xs uppercase tracking-widest"
          >
            Solicitar Turno
          </Link>
        </div>
      </div>

      {/* Banner de Bienvenida (Opcional: puedes agregar avisos generales aquí) */}


      {/* Resumen clínico integrado */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
             <Calendar className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
             <h2 className="text-lg md:text-2xl font-bold text-slate-900 tracking-tight uppercase">Mi información de salud</h2>
          </div>
          <Link href="/appointments" className="text-[10px] font-black text-slate-400 hover:text-slate-900 tracking-[0.2em] transition-colors">VER TODOS LOS TURNOS</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <DashboardSummaryCard icon={<Calendar className="h-5 w-5" />} title="Próximos turnos" isLoading={isLoadingAppointments} actionHref="/appointments" actionLabel="Ir a mis turnos">
            {pendingAppointments.length > 0 ? (
              <div className="space-y-3">
                {pendingAppointments.map((appointment) => (
                  <div key={appointment.id} className="border-l-2 border-blue-500 pl-3">
                    <p className="text-sm font-bold text-slate-800">{appointment.professional.specialty}</p>
                    <p className="text-xs text-slate-500">{format(new Date(appointment.start), "EEEE d 'de' MMMM, HH:mm", { locale: es })}</p>
                    <p className="text-xs text-slate-400 truncate">{appointment.professional.name} · {appointment.facility.name}</p>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-slate-500">No tenés turnos pendientes próximos.</p>}
          </DashboardSummaryCard>

          <DashboardSummaryCard icon={<Pill className="h-5 w-5" />} title="Recetas vigentes" isLoading={false} actionHref="/prescriptions" actionLabel="Ir a recetas">
            <p className="text-sm text-slate-500">Las recetas vigentes estarán disponibles cuando finalice la integración.</p>
          </DashboardSummaryCard>

          <DashboardSummaryCard icon={<FileText className="h-5 w-5" />} title="Órdenes médicas" isLoading={isLoadingStudies} actionHref="/health" actionLabel="Ir a estudios médicos">
            <p className="text-sm text-slate-500">
              {studies && studies.length > 0 ? `${studies.length} estudio${studies.length === 1 ? "" : "s"} disponible${studies.length === 1 ? "" : "s"}.` : "No hay órdenes o estudios disponibles."}
            </p>
          </DashboardSummaryCard>
        </div>
      </div>

      {/* Sección: Centro de Notificaciones y Mensajes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="soft-card p-6 bg-slate-50/30">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[14px] font-black text-slate-900 uppercase tracking-widest">Mensajes Recientes</h3>
            <Link href="/messages" className="text-[10px] font-bold text-slate-500 hover:text-slate-900 tracking-widest decoration-1 underline-offset-4 underline">Bandeja de Entrada</Link>
          </div>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border border-slate-100 hover:border-slate-300 transition-all cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs ring-4 ring-slate-100 italic">
                  Dr
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-bold text-slate-900">{i === 1 ? 'Dr. Alejandro Sanz' : 'Dra. Elena García'}</p>
                    <span className="text-[9px] font-bold text-slate-400">Hace {i * 2}h</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate leading-relaxed">Indicaciones post-estudio enviadas. Por favor revise su correo.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="soft-card p-6">
          <h3 className="text-[14px] font-black text-slate-900 uppercase tracking-widest mb-6">Alertas del Sistema</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 border-l-4 border-indigo-600 bg-indigo-50/30 rounded-r-xl shadow-sm">
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center">
                 <Video className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900">Teleconsulta en 15 min</p>
                <p className="text-xs text-slate-500 mt-1">Tu cita con el Dr. Alejandro Sanz está por comenzar.</p>
                <Link href="/telemedicine" className="text-[10px] font-black text-white uppercase tracking-widest mt-3 inline-block bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded transition-colors shadow-lg shadow-indigo-600/20">Ingresar a Sala</Link>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 border-l-4 border-slate-900 bg-white rounded-r-xl shadow-sm">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                 <Bell className="w-5 h-5 text-slate-900" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900">Estudios Disponibles</p>
                <p className="text-xs text-slate-500 mt-1">Laboratorio Central ha cargado tus resultados del 15/04.</p>
                <Link href="/health" className="text-[10px] font-black text-slate-900 uppercase tracking-widest mt-3 inline-block bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded transition-colors">Ver ahora</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardSummaryCard({
  icon,
  title,
  isLoading,
  actionHref,
  actionLabel,
  children,
}: {
  icon: ReactNode;
  title: string;
  isLoading: boolean;
  actionHref: string;
  actionLabel: string;
  children: ReactNode;
}) {
  return (
    <div className="soft-card min-h-60 p-6 flex flex-col">
      <div className="flex items-center gap-3 mb-5 text-blue-600">
        <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">{icon}</div>
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
      </div>
      <div className="flex-1">
        {isLoading ? (
          <div className="h-24 flex items-center gap-3 text-sm text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            Consultando información...
          </div>
        ) : children}
      </div>
      <Link href={actionHref} className="mt-5 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:text-blue-600 transition-colors">
        {actionLabel} <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

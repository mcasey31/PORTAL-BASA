"use client";

import { 
  Calendar, 
  ClipboardList, 
  Activity, 
  Clock, 
  MessageSquare, 
  Bell, 
  Stethoscope,
  ChevronRight,
  Search,
  MapPin,
  Phone,
  Navigation,
  ArrowRight,
  Plus,
  Video
} from "lucide-react";
import Link from "next/link";
import { api } from "~/trpc/react";
import { useSession } from "next-auth/react";
import { PLATFORM_CONFIG } from "~/config/platform";

const BASA_CENTERS = [
  {
    id: "centro-gallego",
    name: "Centro Gallego",
    type: "CABA",
    address: "Av. Belgrano 2199, CABA",
    phone: "0810 122-2424",
    image: "/images/CENTROS PICS/centro-gallego.png",
    link: "https://centrogallego.ar/",
    guardTime: "15 min",
    status: "normal",
  },
  {
    id: "sanatorio-san-jose",
    name: "Sanatorio San José",
    type: "CABA",
    address: "Sánchez de Bustamante 1674",
    phone: "0810 122-2424",
    image: "/images/CENTROS PICS/sanatorio-san-jose.png",
    link: "https://redbasa.com.ar/sanatorio-san-jose/",
    guardTime: "20 min",
    status: "busy",
  },
  {
    id: "policlinico-avellaneda",
    name: "Policlínico Avellaneda",
    type: "Buenos Aires",
    address: "Av. Pres. Hipólito Yrigoyen 670, Avellaneda",
    phone: "0810 122-2424",
    image: "/images/CENTROS PICS/avellaneda.png",
    link: "https://redbasa.com.ar/policlinico-regional-avellaneda/",
    guardTime: "25 min",
    status: "normal",
  },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const { data: patient } = api.patient.getOnboardingStatus.useQuery();
  const { data: frequentCenters } = api.patient.getFrequentCenters.useQuery();
  
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


      {/* Sección: MIS CENTROS FRECUENTES (Personalización por Paciente) */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
             <MapPin className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
             <h2 className="text-lg md:text-2xl font-bold text-slate-900 tracking-tight uppercase">Mis Centros Frecuentes</h2>
          </div>
          <a
            href="https://redbasa.com.ar/centros-de-salud/"
            target="_blank"
            rel="noreferrer"
            className="text-[10px] font-black text-slate-400 hover:text-slate-900 tracking-[0.2em] transition-colors"
          >
            VER TODAS LAS SEDES
          </a>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {frequentCenters && frequentCenters.length > 0 ? (
            frequentCenters.map((center) => (
              <CenterDashboardCard key={center.id} center={center} isFrequent={true} />
            ))
          ) : (
            BASA_CENTERS.map((center) => (
              <CenterDashboardCard key={center.id} center={center} isFrequent={true} />
            ))
          )}
        </div>
        
        {(!frequentCenters || frequentCenters.length === 0) && (
          <p className="text-center text-slate-400 text-xs font-medium italic pt-4">
            Aún no tienes centros frecuentes. Se muestran las sedes principales por cercanía.
          </p>
        )}
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

function CenterDashboardCard({ center, isFrequent }: { center: any, isFrequent: boolean }) {
  return (
    <div className="soft-card overflow-hidden group flex flex-col relative rounded-[28px] border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
       {isFrequent && (
         <div className="absolute top-4 right-4 z-20">
            <div className="bg-blue-600 text-white text-[10px] sm:text-[11px] font-black px-4 py-2 rounded-full uppercase tracking-[0.15em] shadow-lg flex items-center gap-2">
               <Plus className="w-3 h-3" />
               Frecuente
            </div>
         </div>
       )}
       <div className="h-56 overflow-hidden relative">
          <img 
            src={center.image || '/images/sede-placeholder.png'} 
            alt={center.name} 
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
          <div className="absolute top-4 left-4">
             <span className="bg-white/85 backdrop-blur text-slate-900 text-[11px] font-black px-3 py-2 rounded-xl uppercase tracking-[0.12em] shadow-sm">
                {center.type}
             </span>
          </div>
          <div className="absolute bottom-5 right-5 group-hover:translate-x-1 transition-transform">
             <a
               href={center.link}
               target="_blank"
               rel="noreferrer"
               className="bg-[#111827] text-white p-3 rounded-full shadow-xl inline-flex border border-white/20"
               aria-label={`Abrir ${center.name}`}
             >
                <Navigation className="w-4 h-4" />
             </a>
          </div>
       </div>
       <div className="px-5 pb-5 pt-4 flex-1 flex flex-col bg-white">
          <h4 className="text-[2.1rem] md:text-[2.3rem] font-black leading-none tracking-[-0.06em] text-slate-900 mb-3">{center.name}</h4>
          <div className="flex items-center text-slate-600 text-[1rem] md:text-[1.15rem] font-medium gap-2">
             <MapPin className="w-4 h-4 text-slate-500" />
             <span>{center.address}</span>
          </div>
       </div>
    </div>
  );
}

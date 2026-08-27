"use client";

import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  FileText,
  HeartPulse,
  MapPin,
  Phone,
  ShieldCheck,
  Stethoscope,
  Users,
} from "lucide-react";

const institutionName = "RED BASA";

const serviceCards = [
  {
    title: "Turnos y Consultas",
    description: "Solicita, reprograma y consulta turnos en una experiencia simple y ordenada.",
    icon: CalendarDays,
    accent: "from-[#1f4fbf] to-[#4c6de0]",
  },
  {
    title: "Estudios y Resultados",
    description: "Visualiza resultados e informes en un historial digital seguro y trazable.",
    icon: FileText,
    accent: "from-[#0f2e6d] to-[#1b3f8f]",
  },
  {
    title: "Cobertura y Guardia",
    description: "Conoce centros de la red, servicios activos y circuitos de atencion.",
    icon: ShieldCheck,
    accent: "from-[#2e69d1] to-[#6691ee]",
  },
];

const networkStats = [
  { label: "Centros de Salud", value: "21" },
  { label: "Afiliados", value: "800.000+" },
  { label: "Empleados y Profesionales", value: "6.500+" },
  { label: "Especialidades", value: "41" },
];

const headquarters = [
  {
    name: "Casa Central",
    address: "Azopardo 1405, Piso 7",
    schedule: "Lunes a viernes 8 a 18 hs",
    phone: "0800-555-2272",
  },
  {
    name: "Atencion Nacional",
    address: "Red de clinicas y sanatorios asociados",
    schedule: "Cobertura en multiples provincias",
    phone: "(011) 4300-2200",
  },
];

export default function QuantumHomePage() {
  return (
    <main className="min-h-screen bg-[#f4f7ff] text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <nav className="sticky top-0 z-50 border-b border-blue-100/80 bg-white/95 backdrop-blur-2xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 lg:px-12 lg:py-5">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-[#1f4fbf] to-[#4c6de0] shadow-xl shadow-blue-600/25">
              <HeartPulse className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.26em] text-[#1f4fbf]">{institutionName}</p>
              <p className="text-base font-extrabold tracking-tight text-slate-900 lg:text-lg">Portal Paciente</p>
            </div>
          </div>

          <div className="hidden items-center gap-10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 lg:flex">
            <a href="#servicios" className="transition-colors hover:text-[#1f4fbf]">Servicios</a>
            <a href="#red" className="transition-colors hover:text-[#1f4fbf]">La Red</a>
            <a href="#contacto" className="transition-colors hover:text-[#1f4fbf]">Contacto</a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/auth/signin"
              className="rounded-full bg-gradient-to-r from-[#1f4fbf] to-[#4c6de0] px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-blue-600/25 transition-all hover:-translate-y-[1px] hover:from-[#17439f] hover:to-[#3f60d0]"
            >
              Portal Paciente
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden px-6 pb-24 pt-14 lg:px-12 lg:pb-32 lg:pt-20">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-16 top-0 h-80 w-80 rounded-full bg-blue-200/50 blur-3xl" />
          <div className="absolute right-0 top-8 h-[26rem] w-[26rem] rounded-full bg-indigo-100/70 blur-3xl" />
          <div className="absolute bottom-6 left-1/3 h-52 w-52 rounded-full bg-cyan-100/70 blur-2xl" />
        </div>

        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-[#1f4fbf]">
              <Building2 className="h-3.5 w-3.5" />
              Cobertura de salud en todo el pais
            </div>

            <h1 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-tight text-[#0e2454] md:text-7xl">
              Bienvenido al
              <span className="block bg-gradient-to-r from-[#1f4fbf] via-[#2f66de] to-[#0f2e6d] bg-clip-text text-transparent">
                Portal Paciente
              </span>
            </h1>

            <p className="max-w-2xl text-lg leading-relaxed text-slate-600 md:text-xl">
              Gestiona turnos, estudios y seguimiento de tu atencion en una plataforma digital segura,
              conectada al HIS institucional.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href="/auth/signin"
                className="group inline-flex items-center justify-center gap-3 rounded-[1.2rem] bg-[#0f2e6d] px-8 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-[#0b2559]"
              >
                Ingresar al Portal Paciente
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#red"
                className="inline-flex items-center justify-center rounded-[1.2rem] border border-blue-200 bg-white px-8 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-[#1f4fbf] transition-colors hover:border-blue-300 hover:text-[#153f9c]"
              >
                Conocer la red
              </a>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3 md:grid-cols-4">
              {networkStats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
                  <p className="text-2xl font-black tracking-tight text-[#0f2e6d]">{stat.value}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -right-4 -top-6 h-24 w-24 rounded-full bg-blue-200/80 blur-2xl" />
            <div className="rounded-[2rem] border border-blue-100 bg-white p-7 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.25)]">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#1f4fbf]">Acceso seguro</p>
                  <p className="text-lg font-black tracking-tight text-slate-900">Autogestion del paciente</p>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#0f2e6d] text-white">
                  <Stethoscope className="h-5 w-5" />
                </div>
              </div>

              <div className="space-y-3">
                {[
                  "Confirmacion automatica de turnos",
                  "Acceso unificado a estudios y recetas",
                  "Trazabilidad de atencion por centro",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#1f4fbf]" />
                    <p className="text-sm font-semibold text-slate-700">{item}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl bg-gradient-to-r from-[#0f2e6d] via-[#1f4fbf] to-[#3f68de] p-5 text-white">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/85">Diagnostico por imagenes</p>
                <p className="mt-2 text-2xl font-black tracking-tight">Conoce este servicio de la red</p>
                <p className="mt-2 text-sm text-white/90">Atencion integrada y soporte institucional con trazabilidad digital.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="servicios" className="bg-white px-6 py-24 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#1f4fbf]">Servicios digitales</p>
              <h2 className="mt-3 text-4xl font-black tracking-tight text-[#0f2e6d] md:text-5xl">
                Tu experiencia de atencion, en tiempo real.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600">
                Un portal preparado para operar con la red prestacional y conectarse a HIS institucionales con una capa de integracion desacoplada.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {serviceCards.map((service) => {
              const Icon = service.icon;
              return (
                <article
                  key={service.title}
                  className="group rounded-[1.8rem] border border-slate-100 bg-slate-50/70 p-7 transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:shadow-xl hover:shadow-blue-100/50"
                >
                  <div className={`mb-5 inline-grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-white ${service.accent}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-black tracking-tight text-slate-900">{service.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{service.description}</p>
                  <Link href="/auth/signin" className="mt-6 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#1f4fbf] transition-colors hover:text-[#153f9c]">
                    Portal Paciente
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="red" className="bg-[#0d2454] px-6 py-24 text-white lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-blue-200">La red</p>
              <h2 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
                Presencia nacional y atencion humanizada.
              </h2>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-blue-100/90">
                Somos una red de servicios de salud nacional reconocida por la magnitud de su cobertura,
                calidad asistencial y mejora continua.
              </p>

              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                {[
                  "21 centros distribuidos en distintas regiones",
                  "Cobertura para afiliados de obras sociales y prepagos",
                  "Estructura de servicios complementarios de salud",
                  "Experiencia paciente con foco en calidad y seguridad",
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/15 bg-white/10 p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-blue-200" />
                      <p className="text-sm font-semibold text-white/95">{item}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 rounded-[1.8rem] border border-white/20 bg-gradient-to-br from-white/15 to-white/10 p-6 backdrop-blur-md">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <Building2 className="h-5 w-5 text-blue-200" />
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-blue-100">Sedes de referencia</p>
              </div>

              {headquarters.map((hq) => (
                <article key={hq.name} className="rounded-2xl border border-white/15 bg-[#12306a]/70 p-4">
                  <h3 className="text-lg font-black tracking-tight text-white">{hq.name}</h3>
                  <div className="mt-3 space-y-2 text-sm text-blue-100/90">
                    <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-blue-200" /> {hq.address}</p>
                    <p className="flex items-center gap-2"><Building2 className="h-4 w-4 text-blue-200" /> {hq.schedule}</p>
                    <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-blue-200" /> {hq.phone}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="contacto" className="bg-white px-6 py-20 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-blue-100 bg-gradient-to-r from-[#1f4fbf] via-[#355fd3] to-[#0f2e6d] p-10 text-white shadow-2xl shadow-blue-300/30 lg:p-16">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/90">Nuevo canal digital</p>
              <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
                Listo para activar tu Portal Paciente?
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/90">
                Implementacion agil, branding institucional y conexion con HIS mediante una capa de integracion desacoplada.
              </p>
            </div>

            <div className="space-y-3 rounded-2xl border border-white/25 bg-white/10 p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-white" />
                <p className="text-sm font-semibold text-white">Mesa de soporte institucional</p>
              </div>
              <Link href="/auth/signin" className="inline-flex w-full items-center justify-center gap-3 rounded-xl bg-white px-6 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-[#1f4fbf] transition-colors hover:bg-blue-50">
                Ingresar al Portal Paciente
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="text-xs font-semibold text-white/90">Canal administrativo: 0800-555-2272</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-blue-100 bg-white px-6 py-10 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-center md:flex-row md:items-center md:justify-between md:text-left">
          <div className="flex items-center justify-center gap-3 md:justify-start">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#1f4fbf] to-[#4c6de0]">
              <HeartPulse className="h-4 w-4 text-white" />
            </div>
            <p className="text-sm font-black tracking-tight text-slate-900">RED BASA Portal Paciente</p>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
            Azopardo 1405 Piso 7, CABA | redbasasalud
          </p>
        </div>
      </footer>
    </main>
  );
}

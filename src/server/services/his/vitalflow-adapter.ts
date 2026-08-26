import type { AppointmentStatus, UniversalAppointment } from "./universal-types";

/**
 * Adaptador real para el HIS VitalFlow.
 * Llama al backend .NET via la variable HIS_API_BASE_URL.
 * Usa el token de admin del HIS para autenticar las llamadas server-side.
 */

const HIS_BASE = process.env.HIS_API_BASE_URL;
const HIS_USER = process.env.HIS_API_USERNAME;
const HIS_PASSWORD = process.env.HIS_API_PASSWORD;
const HIS_LOGIN_CENTRO_ID = process.env.HIS_LOGIN_CENTRO_ID ?? "global";
const HIS_LOCAL_UTC_OFFSET = process.env.HIS_LOCAL_UTC_OFFSET ?? "-03:00";

function getRequiredHisConfig() {
  if (!HIS_BASE || !HIS_USER || !HIS_PASSWORD) {
    throw new Error("[HISAdapter] Missing HIS_API_BASE_URL, HIS_API_USERNAME or HIS_API_PASSWORD");
  }

  return {
    base: HIS_BASE,
    user: HIS_USER,
    password: HIS_PASSWORD,
  };
}

// Tipos que devuelven los endpoints del HIS
export type HisSelectoresResponse = {
  centros: { id: string; nombre: string }[];
  servicios: { id: string; nombre: string; centroIds: string[] }[];
  practicas: { id: string; nombre: string; servicioId: string; centroIds: string[]; profesionalIds: string[] }[];
  profesionales: { id: string; nombre: string; centroIds: string[]; servicioIds: string[]; practicaIds: string[] }[];
};

export type HisSlot = {
  id: string;
  fecha: string;
  hora: string;
  tipoSlot: "NORMAL" | "ST";
  rangoHoraInicio: string;
  rangoHoraFin: string;
  centro: string;
  servicio: string;
  practica: string;
  profesional: string;
  estado: "DISPONIBLE" | "CON_CUPO" | "SIN_COBERTURA" | "ASIGNADO";
  sobreTurnosDisponibles?: number;
  mensaje?: string;
};

export type HisFinanciadorCatalogo = {
  financiadorId: string;
  financiadorCodigo: string;
  financiadorNombre: string;
  planId: string;
  planCodigo: string;
  planNombre: string;
};

export type HisBuscarRequest = {
  pacienteId: string;
  centroIds: string[];
  servicioId: string;
  practicaId: string;
  profesionalId?: string;
};

type HisTurnoPaciente = {
  id: string;
  profesional: string;
  servicio: string;
  centro: string;
  fechaHora: string;
  estado: string;
  motivo?: string;
};

type HisTurnosPacientePage = {
  items: HisTurnoPaciente[];
  total: number;
  page: number;
  pageSize: number;
};

type HisPacienteIdentificado = {
  id: string;
  tipoDocumento: string;
  numeroDocumento: string;
  apellidosNombres: string;
};

// ── Helpers ─────────────────────────────────────────────────────────────────

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getHisToken(): Promise<string> {
  const cfg = getRequiredHisConfig();
  const now = Date.now();
  if (cachedToken && now < tokenExpiry) return cachedToken;

  const loginBody = JSON.stringify({
    username: cfg.user,
    password: cfg.password,
    centroId: HIS_LOGIN_CENTRO_ID,
  });
  const res = await fetch(`${cfg.base}/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: loginBody,
  });

  if (!res.ok) {
    throw new Error(`[HISAdapter] Login falló: ${res.status}`);
  }

  const data = (await res.json()) as { accessToken: string };
  cachedToken = data.accessToken;
  tokenExpiry = now + 20 * 60 * 1000; // cachea 20 min
  return cachedToken;
}

async function hisGet<T>(path: string): Promise<T> {
  const cfg = getRequiredHisConfig();
  const token = await getHisToken();
  const res = await fetch(`${cfg.base}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`[HISAdapter] GET ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

async function hisPost<T>(path: string, body: unknown): Promise<T> {
  const cfg = getRequiredHisConfig();
  const token = await getHisToken();
  const res = await fetch(`${cfg.base}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`[HISAdapter] POST ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

// ── Funciones públicas ───────────────────────────────────────────────────────

export async function getSelectores(): Promise<HisSelectoresResponse> {
  return hisGet<HisSelectoresResponse>("/v1/turnos/disponibilidad/selectores");
}

export async function buscarDisponibilidad(req: HisBuscarRequest): Promise<HisSlot[]> {
  return hisPost<HisSlot[]>("/v1/turnos/disponibilidad/buscar", req);
}

export async function getHisFinanciadoresCatalogo(): Promise<HisFinanciadorCatalogo[]> {
  return hisGet<HisFinanciadorCatalogo[]>("/v1/turnos/financiadores/catalogo");
}

export async function guardarFinanciadorPacienteHis(
  pacienteId: string,
  request: { financiadorId: string; planId: string; numeroAfiliado?: string }
): Promise<void> {
  await hisPost(`/v1/turnos/pacientes/${encodeURIComponent(pacienteId)}/financiadores`, {
    financiadorId: request.financiadorId,
    planId: request.planId,
    numeroAfiliado: request.numeroAfiliado,
    reemplazarFinanciadorPlanId: null,
  });
}

export async function getHisPatientIdByDni(dni: string): Promise<string | null> {
  const numeroDocumento = dni.trim();
  if (!numeroDocumento) {
    return null;
  }

  const query = new URLSearchParams({
    tipoDocumento: "DNI",
    numeroDocumento,
  }).toString();

  const pacientes = await hisGet<HisPacienteIdentificado[]>(
    `/v1/turnos/identificacion/paciente?${query}`
  );

  if (!Array.isArray(pacientes) || pacientes.length === 0) {
    return null;
  }

  const exact = pacientes.find(
    (p) =>
      p.tipoDocumento?.toUpperCase() === "DNI" &&
      p.numeroDocumento?.trim() === numeroDocumento
  );

  return (exact ?? pacientes[0])?.id ?? null;
}

function mapTurnoEstadoToAppointmentStatus(estado: string): AppointmentStatus {
  const normalized = estado.trim().toUpperCase();
  if (normalized === "AGENDADO" || normalized === "PROGRAMADO") return "confirmed";
  if (normalized === "ANULADO") return "cancelled";
  if (normalized.includes("CANCELADO")) return "cancelled";
  if (normalized === "CONSUMIDO") return "completed";
  return "pending";
}

function parseHisTurnoDate(fechaHora: string): Date {
  const raw = fechaHora.trim();
  const normalized = raw.endsWith("Z") ? raw.replace(/Z$/i, "+00:00") : raw;

  // HIS currently returns many local appointments as +00:00. Reinterpret as local HIS offset.
  if (/[+-]00:00$/i.test(normalized)) {
    const asLocal = normalized.replace(/[+-]00:00$/i, HIS_LOCAL_UTC_OFFSET);
    const reparsed = new Date(asLocal);
    if (!Number.isNaN(reparsed.getTime())) {
      return reparsed;
    }
  }

  const parsed = new Date(raw);
  return parsed;
}

function mapHisTurnoToUniversal(turno: HisTurnoPaciente): UniversalAppointment {
  const start = parseHisTurnoDate(turno.fechaHora);
  const end = new Date(start.getTime() + 20 * 60 * 1000);

  return {
    id: turno.id,
    externalId: turno.id,
    start,
    end,
    status: mapTurnoEstadoToAppointmentStatus(turno.estado),
    professional: {
      id: turno.profesional,
      name: turno.profesional,
      specialty: turno.servicio,
    },
    facility: {
      id: turno.centro,
      name: turno.centro,
    },
    reason: turno.motivo,
  };
}

export async function getPatientAppointmentsFromHis(
  pacienteId: string,
  options?: { historial?: boolean; page?: number; pageSize?: number }
): Promise<UniversalAppointment[]> {
  const historial = options?.historial ?? false;
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 20;
  const query = new URLSearchParams({
    historial: String(historial),
    page: String(page),
    pageSize: String(pageSize),
  }).toString();

  const data = await hisGet<HisTurnosPacientePage>(
    `/v1/turnos/pacientes/${encodeURIComponent(pacienteId)}/turnos?${query}`
  );

  return data.items.map(mapHisTurnoToUniversal);
}

export async function reservarTurno(slotId: string, pacienteId: string): Promise<{ id: string; externalId: string; success: boolean }> {
  const body = { slotId, pacienteId };
  const result = await hisPost<{ id: string; externalId: string; success: boolean }>(
    "/v1/turnos/reservar",
    body
  );
  return result;
}

export async function cancelarTurno(turnoId: string, motivo?: string): Promise<{ turnoId: string; estado: string }> {
  const result = await hisPost<{ turnoId: string; estado: string; motivo?: string }>(
    `/v1/admision/turnos/${encodeURIComponent(turnoId)}/estado`,
    {
      // El endpoint de admision no acepta estados "CANCELADO_*".
      // Para cancelacion desde portal usamos NO_ADMITIDO con motivo explicito.
      Estado: "NO_ADMITIDO",
      Motivo: motivo ?? "Cancelado por el paciente desde el portal",
    }
  );
  return result;
}

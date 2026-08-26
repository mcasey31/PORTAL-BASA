import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { getSelectores, buscarDisponibilidad, getPatientAppointmentsFromHis, reservarTurno, cancelarTurno } from "~/server/services/his/vitalflow-adapter";

async function getHisPatientIdForUser(userId: string): Promise<string> {
  const patient = await db.patient.findUnique({
    where: { userId },
    select: { hisId: true },
  });

  if (!patient?.hisId) {
    throw new Error("Paciente sin vinculacion HIS. Complete onboarding y mapeo hisId.");
  }

  return patient.hisId;
}


export const healthRouter = createTRPCRouter({
  // Obtener resumen para el Dashboard
  getDashboardSummary: protectedProcedure.query(async ({ ctx }) => {
    const hisPatientId = await getHisPatientIdForUser(ctx.session.user.id);
    const appointments = await getPatientAppointmentsFromHis(hisPatientId, {
      historial: false,
      page: 1,
      pageSize: 20,
    });

    return {
      nextAppointment: appointments[0] ?? null,
      recentStudiesCount: 0,
      latestStudy: null,
      appointmentsCount: appointments.length
    };
  }),

  // Obtener todos los estudios detallados con filtros
  getMedicalHistory: protectedProcedure
    .input(z.object({
      type: z.enum(['LAB', 'IMG']).optional(),
      days: z.number().optional()
    }).optional())
    .query(async () => {
      // Sin endpoint HIS integrado para estudios en este router.
      // No devolvemos datos mock para evitar resultados falsos.
      return [];
    }),

  // Obtener turnos reservados del paciente: futuros + historial
  getAppointments: protectedProcedure.query(async ({ ctx }) => {
    const hisPatientId = await getHisPatientIdForUser(ctx.session.user.id);

    const futureAppointments = await getPatientAppointmentsFromHis(hisPatientId, {
      historial: false,
      page: 1,
      pageSize: 20,
    });

    const pastAppointments = await getPatientAppointmentsFromHis(hisPatientId, {
      historial: true,
      page: 1,
      pageSize: 20,
    });

    return {
      future: futureAppointments,
      past: pastAppointments,
    };
  }),

  // ── Integración HIS real ────────────────────────────────────────────────

  // Obtener centros, servicios, prácticas y profesionales disponibles
  getSelectores: publicProcedure.query(async () => {
    return await getSelectores();
  }),

  // Buscar slots disponibles según filtros (para "Solicitar Nuevo Turno")
  searchAvailableSlots: protectedProcedure
    .input(z.object({
      centroIds: z.array(z.string()).min(1),
      servicioId: z.string().min(1),
      practicaId: z.string().min(1).optional(),
      profesionalId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const hisPatientId = await getHisPatientIdForUser(ctx.session.user.id);
      const slots = await buscarDisponibilidad({
        pacienteId: hisPatientId,
        centroIds: input.centroIds,
        servicioId: input.servicioId,
        practicaId: input.practicaId || "",
        profesionalId: input.profesionalId,
      });

      return slots
        .filter((slot) => slot.tipoSlot !== "ST")
        .map((slot, idx) => ({
          id: slot.id || `slot-${idx}`,
          externalId: slot.id,
          start: new Date(`${slot.fecha}T${slot.hora}`),
          end: new Date(`${slot.fecha}T${slot.hora}:30`),
          status: "available" as const,
          professional: {
            id: slot.profesional,
            name: slot.profesional,
            specialty: slot.servicio,
          },
          facility: {
            id: slot.centro,
            name: slot.centro,
          },
          reason: `${slot.servicio} - ${slot.practica}`,
        }));
    }),

  // Buscar slots por flujo de cascada: centro -> servicio -> profesional (opcional)
  searchAvailableSlotsCascade: protectedProcedure
    .input(z.object({
      centroId: z.string().min(1),
      servicioId: z.string().min(1),
      profesionalId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const hisPatientId = await getHisPatientIdForUser(ctx.session.user.id);
      const selectores = await getSelectores();

      const practicas = selectores.practicas.filter((p) => {
        if (p.servicioId !== input.servicioId) return false;
        if (!p.centroIds.includes(input.centroId)) return false;
        if (input.profesionalId && !p.profesionalIds.includes(input.profesionalId)) return false;
        return true;
      });

      if (practicas.length === 0) {
        return [];
      }

      const allSlots = await Promise.all(
        practicas.map((practica) =>
          buscarDisponibilidad({
            pacienteId: hisPatientId,
            centroIds: [input.centroId],
            servicioId: input.servicioId,
            practicaId: practica.id,
            profesionalId: input.profesionalId,
          })
        )
      );

      const unique = new Map<string, (typeof allSlots)[number][number]>();
      for (const slotsByPractica of allSlots) {
        for (const slot of slotsByPractica) {
          const key = slot.id || `${slot.fecha}|${slot.hora}|${slot.centro}|${slot.servicio}|${slot.practica}|${slot.profesional}`;
          if (!unique.has(key)) {
            unique.set(key, slot);
          }
        }
      }

      return Array.from(unique.values())
        .filter((slot) => slot.tipoSlot !== "ST")
        .map((slot, idx) => ({
          id: slot.id || `slot-${idx}`,
          externalId: slot.id,
          start: new Date(`${slot.fecha}T${slot.hora}`),
          end: new Date(`${slot.fecha}T${slot.hora}:30`),
          status: "available" as const,
          professional: {
            id: slot.profesional,
            name: slot.profesional,
            specialty: slot.servicio,
          },
          facility: {
            id: slot.centro,
            name: slot.centro,
          },
          reason: `${slot.servicio} - ${slot.practica}`,
      }));
    }),

  // --- TELEMEDICINA ---
  joinQueue: protectedProcedure
    .input(z.object({ specialty: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userEmail = ctx.session.user.email;
      if (!userEmail) throw new Error("No hay email en la sesión");
      
      console.log("MUTATION: joinQueue para email:", userEmail);

      // 1. Buscar o crear usuario por EMAIL
      const user = await db.user.upsert({
        where: { email: userEmail },
        update: {},
        create: {
            email: userEmail,
            name: ctx.session.user.name || "Usuario"
        }
      });

      // 2. Vincular paciente
      const patient = await db.patient.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id, onboardingCompleted: true }
      });

      console.log("Paciente vinculado:", patient.id);

      // Cancelar WAITING previos
      await db.telemedicineCall.updateMany({
        where: { patientId: patient.id, status: "WAITING" },
        data: { status: "CANCELLED" },
      });

      // Crear nueva llamada
      return await db.telemedicineCall.create({
        data: {
          patientId: patient.id,
          specialty: input.specialty,
          status: "WAITING",
        },
      });
    }),

  getActiveCall: protectedProcedure.query(async ({ ctx }) => {
    const userEmail = ctx.session?.user?.email;
    if (!userEmail) return null;

    try {
      const user = await db.user.findUnique({
          where: { email: userEmail },
          include: { patient: true }
      });
      
      if (!user?.patient) return null;

      return db.telemedicineCall.findFirst({
        where: { 
          patientId: user.patient.id, 
          status: { in: ["WAITING", "IN_PROGRESS", "COMPLETED"] } 
        },
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      console.error("Error in getActiveCall:", error);
      return null;
    }
  }),

  // Médico: Ver pacientes en espera
  getWaitingQueue: publicProcedure.query(async () => {
    return db.telemedicineCall.findMany({
      where: { status: "WAITING" },
      include: { patient: { include: { user: true } } },
      orderBy: { createdAt: "asc" },
    });
  }),

  // Médico: Ver si tengo una llamada activa para reconectar
  getDoctorActiveCall: publicProcedure
    .input(z.object({ doctorName: z.string() }))
    .query(async ({ input }) => {
      return db.telemedicineCall.findFirst({
        where: { 
            doctorId: input.doctorName, 
            status: "IN_PROGRESS" 
        },
        include: { patient: { include: { user: true } } },
        orderBy: { updatedAt: "desc" },
      });
    }),

  // Médico: Aceptar un paciente
  acceptCall: publicProcedure
    .input(z.object({ callId: z.string(), doctorName: z.string() }))
    .mutation(async ({ input }) => {
      const roomName = `quantum-call-${input.callId.slice(-6)}`;
      return db.telemedicineCall.update({
        where: { id: input.callId },
        data: {
          status: "IN_PROGRESS",
          doctorId: input.doctorName,
          roomName,
          startTime: new Date(),
        },
        include: { patient: { include: { user: true } } },
      });
    }),

  // Finalizar llamada
  endCall: publicProcedure
    .input(z.object({ callId: z.string() }))
    .mutation(async ({ input }) => {
      return db.telemedicineCall.update({
        where: { id: input.callId },
        data: {
          status: "COMPLETED",
          endTime: new Date(),
        },
      });
    }),

  // Guardar encuesta de satisfacción
  submitSurvey: publicProcedure
    .input(z.object({
      callId: z.string(),
      patientId: z.string(),
      attentionRating: z.string(),
      connectionRating: z.string(),
      videoRating: z.string(),
      audioRating: z.string(),
      comment: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return db.telemedicineSurvey.create({
        data: {
          callId: input.callId,
          patientId: input.patientId,
          attentionRating: input.attentionRating,
          connectionRating: input.connectionRating,
          videoRating: input.videoRating,
          audioRating: input.audioRating,
          comment: input.comment,
        }
      });
    }),

  // Reservar turno en el HIS
  reservarTurno: protectedProcedure
    .input(z.object({
      slotId: z.string().describe("ID del slot/turno disponible"),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        console.log(`[health.reservarTurno] User ${ctx.session.user.id} reserving slot ${input.slotId}`);

        const hisPatientId = await getHisPatientIdForUser(ctx.session.user.id);

        // Call HIS to reserve the slot
        const result = await reservarTurno(input.slotId, hisPatientId);
        
        console.log(`[health.reservarTurno] Reservation result:`, result);
        
        return {
          success: result.success,
          appointmentId: result.id || result.externalId,
          message: result.success ? "Turno reservado exitosamente" : "Error al reservar el turno",
        };
      } catch (e) {
        console.error("[health.reservarTurno] Error:", e);
        throw new Error(`Failed to reserve appointment: ${String(e)}`);
      }
    }),

  cancelarTurno: protectedProcedure
    .input(z.object({
      turnoId: z.string(),
      motivo: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      console.log(`[health.cancelarTurno] User ${ctx.session.user.id} cancelling turno ${input.turnoId}`);
      try {
        const result = await cancelarTurno(input.turnoId, input.motivo);
        return { success: true, estado: result.estado };
      } catch (e) {
        console.error("[health.cancelarTurno] Error:", e);
        throw new Error(`No se pudo cancelar el turno: ${String(e)}`);
      }
    }),
});

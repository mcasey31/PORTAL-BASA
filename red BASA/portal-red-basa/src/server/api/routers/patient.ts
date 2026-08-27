import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { getHisFinanciadoresCatalogo, guardarFinanciadorPacienteHis } from "~/server/services/his/vitalflow-adapter";

export const patientRouter = createTRPCRouter({
  // Obtener estado de onboarding y datos actuales
  getOnboardingStatus: protectedProcedure.query(async ({ ctx }) => {
    try {
        let patient = await ctx.db.patient.findUnique({
          where: { userId: ctx.session.user.id },
          include: { insurance: true, plan: true }
        });

        // AUTO-ONBOARD: Si el paciente es nuevo, lo creamos con onboardingCompleted = true
        if (!patient) {
          // Buscar el User real en BD por email (el token.sub puede no coincidir con el id de BD si hubo desincronización)
          const sessionEmail = ctx.session.user.email;
          let realUserId = ctx.session.user.id;
          if (sessionEmail) {
            const userByEmail = await ctx.db.user.findUnique({ where: { email: sessionEmail }, select: { id: true } });
            if (userByEmail) {
              realUserId = userByEmail.id;
            } else {
              // El user no existe ni por id ni por email: crearlo con el id correcto
              await ctx.db.user.create({
                data: {
                  id: ctx.session.user.id,
                  email: sessionEmail,
                  name: ctx.session.user.name ?? "Paciente",
                },
              });
            }
          }
          // Verificar nuevamente con el realUserId antes de crear
          const existingByRealId = await ctx.db.patient.findUnique({
            where: { userId: realUserId },
            include: { insurance: true, plan: true }
          });
          if (existingByRealId) {
            patient = existingByRealId;
          } else {
            patient = await ctx.db.patient.create({
              data: { userId: realUserId, onboardingCompleted: true },
              include: { insurance: true, plan: true }
            });
          }
        } else if (!patient.onboardingCompleted) {
          // Si existe pero no completó onboarding, lo actualizamos
          patient = await ctx.db.patient.update({
            where: { userId: ctx.session.user.id },
            data: { onboardingCompleted: true },
            include: { insurance: true, plan: true }
          });
        }
        return patient;
    } catch (e) {
        console.error("Error en getOnboardingStatus:", e);
        throw new Error("No se pudo obtener el perfil del paciente");
    }
  }),

  // Listar Obras Sociales para el buscador
  getInsuranceProviders: protectedProcedure.query(async ({ ctx }) => {
    const hisCatalogo = await getHisFinanciadoresCatalogo();

    for (const item of hisCatalogo) {
      const provider = await ctx.db.insuranceProvider.upsert({
        where: { hisFinanciadorId: item.financiadorId },
        update: {
          name: item.financiadorNombre,
          code: item.financiadorCodigo || null,
        },
        create: {
          name: item.financiadorNombre,
          code: item.financiadorCodigo || null,
          hisFinanciadorId: item.financiadorId,
        },
      });

      await ctx.db.insurancePlan.upsert({
        where: { hisPlanId: item.planId },
        update: {
          name: item.planNombre,
          insuranceProviderId: provider.id,
        },
        create: {
          name: item.planNombre,
          insuranceProviderId: provider.id,
          hisPlanId: item.planId,
        },
      });
    }

    return await ctx.db.insuranceProvider.findMany({
      include: { plans: { orderBy: { name: "asc" } } },
      orderBy: { name: "asc" }
    });
  }),

  // Actualizar perfil (Finalizar Onboarding)
  updateProfile: protectedProcedure
    .input(z.object({
      dni: z.string().min(7),
      address: z.string().min(5),
      city: z.string().min(3),
      postalCode: z.string().min(4),
      insuranceProviderId: z.string(),
      insurancePlanId: z.string(),
      membershipNumber: z.string().min(5),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.patient.update({
        where: { userId: ctx.session.user.id },
        data: {
          ...input,
          onboardingCompleted: true
        }
      });
    }),

  // Simulación de validación de token / credencial
  validateInsurance: protectedProcedure
    .input(z.object({
      providerId: z.string(),
      membershipNumber: z.string()
    }))
    .mutation(async ({ input }) => {
      // Simulamos un delay de red y una validación lógica
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const isValid = input.membershipNumber.length > 5;
      
      if (!isValid) {
          throw new Error("Credencial no válida o plan inactivo");
      }

      return {
        status: "VALIDATED",
        token: `AUTH-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60) // 1 hora de validez
      };
    }),

  // Obtener centros frecuentes o favoritos
  getFrequentCenters: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session?.user?.id;
    if (!userId) return [];

    try {
      const patient = await ctx.db.patient.findUnique({
        where: { userId },
        include: {
          favoriteCenters: {
            include: { center: true },
            orderBy: [
              { isFavorite: "desc" },
              { visitCount: "desc" }
            ],
            take: 3
          }
        }
      });
  
      if (!patient || patient.favoriteCenters.length === 0) {
        return [];
      }
  
      return patient.favoriteCenters.map(fc => ({
        ...fc.center,
        isFavorite: fc.isFavorite,
        visitCount: fc.visitCount
      }));
    } catch (error) {
      console.error("Error in getFrequentCenters:", error);
      return [];
    }
  }),

  // Marcar un centro como favorito
  toggleFavoriteCenter: protectedProcedure
    .input(z.object({ centerId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const patient = await ctx.db.patient.findUnique({
        where: { userId: ctx.session.user.id }
      });

      if (!patient) throw new Error("Paciente no encontrado");

      const existing = await ctx.db.favoriteCenter.findUnique({
        where: {
          patientId_centerId: {
            patientId: patient.id,
            centerId: input.centerId
          }
        }
      });

      if (existing) {
        return await ctx.db.favoriteCenter.update({
          where: {
            patientId_centerId: {
              patientId: patient.id,
              centerId: input.centerId
            }
          },
          data: { isFavorite: !existing.isFavorite }
        });
      } else {
        return await ctx.db.favoriteCenter.create({
          data: {
            patientId: patient.id,
            centerId: input.centerId,
            isFavorite: true
          }
        });
      }
    }),

  // Obtener perfil completo para la sección Mi Cuenta
  getFullProfile: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.patient.findUnique({
      where: { userId: ctx.session.user.id },
      include: { 
        user: {
            select: { name: true, email: true, image: true }
        },
        insurance: true, 
        plan: true 
      }
    });
  }),

  // Actualización de datos desde Mi Cuenta
  updateFullProfile: protectedProcedure
    .input(z.object({
      name: z.string().min(2),
      phoneNumber: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      postalCode: z.string().optional(),
      insuranceProviderId: z.string().optional(),
      insurancePlanId: z.string().optional(),
      membershipNumber: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { name, ...patientData } = input;
      
      // Actualizar nombre en User
      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { name }
      });

      const patientBefore = await ctx.db.patient.findUnique({
        where: { userId: ctx.session.user.id },
        include: {
          plan: {
            include: {
              insurance: true,
            },
          },
        },
      });

      if (!patientBefore) {
        throw new Error("Paciente no encontrado.");
      }

      const selectedPlanId = patientData.insurancePlanId ?? patientBefore.insurancePlanId;
      const plan = selectedPlanId
        ? await ctx.db.insurancePlan.findUnique({
            where: { id: selectedPlanId },
            include: { insurance: true },
          })
        : null;

      if (selectedPlanId && !plan) {
        throw new Error("El plan seleccionado no existe.");
      }

      if (plan) {
        if (!plan.hisPlanId || !plan.insurance?.hisFinanciadorId) {
          throw new Error("El plan seleccionado no está sincronizado con HIS. Recargá la pantalla e intentá de nuevo.");
        }

        if (patientBefore.hisId) {
          await guardarFinanciadorPacienteHis(patientBefore.hisId, {
            financiadorId: plan.insurance.hisFinanciadorId,
            planId: plan.hisPlanId,
            numeroAfiliado: patientData.membershipNumber ?? patientBefore.membershipNumber ?? undefined,
          });
        }
      }

      // Actualizar datos en Patient
      return await ctx.db.patient.update({
        where: { userId: ctx.session.user.id },
        data: patientData
      });
    }),
});

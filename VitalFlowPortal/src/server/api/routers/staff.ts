import { z } from "zod";
import { adminAuthorizationProcedure, createTRPCRouter, publicProcedure, staffAuthorizationProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";

export const staffRouter = createTRPCRouter({
  listBackofficeUsers: adminAuthorizationProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findMany({
      where: { role: { in: ["ADMIN", "STAFF"] } },
      select: { id: true, name: true, email: true, username: true, role: true },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    });
  }),

  createBackofficeUser: adminAuthorizationProcedure
    .input(z.object({
      name: z.string().trim().min(2).max(120),
      email: z.string().trim().email().max(254).optional().or(z.literal("")),
      username: z.string().trim().min(3).max(60),
      password: z.string().min(8).max(128),
      role: z.enum(["ADMIN", "STAFF"]),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.create({
        data: {
          name: input.name,
          email: input.email || null,
          username: input.username,
          password: input.password,
          role: input.role,
        },
        select: { id: true, name: true, email: true, username: true, role: true },
      });
    }),

  getAuthorizationAccounts: staffAuthorizationProcedure
    .input(z.object({ search: z.string().trim().max(100).optional() }).optional())
    .query(async ({ ctx, input }) => {
      const search = input?.search?.trim();
      return ctx.db.patient.findMany({
        where: search ? {
          OR: [
            { dni: { contains: search, mode: "insensitive" } },
            { user: { name: { contains: search, mode: "insensitive" } } },
            { dependentsAsPrincipal: { some: { OR: [
              { dni: { contains: search, mode: "insensitive" } },
              { name: { contains: search, mode: "insensitive" } },
            ] } } },
          ],
        } : undefined,
        select: {
          id: true,
          dni: true,
          tipoDocumentoCodigo: true,
          user: { select: { name: true, email: true } },
          dependentsAsPrincipal: {
            select: {
              id: true,
              name: true,
              dni: true,
              tipoDocumentoCodigo: true,
              status: true,
              relationshipDocument: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
    }),

  getDependentReviewReport: staffAuthorizationProcedure
    .input(z.object({ search: z.string().trim().max(100).optional() }).optional())
    .query(async ({ ctx, input }) => {
      const search = input?.search?.trim();
      return ctx.db.dependent.findMany({
        where: {
          status: { in: ["ACTIVE", "REJECTED"] },
          ...(search ? {
            OR: [
              { dni: { contains: search, mode: "insensitive" } },
              { name: { contains: search, mode: "insensitive" } },
              { principalPatient: { dni: { contains: search, mode: "insensitive" } } },
              { principalPatient: { user: { name: { contains: search, mode: "insensitive" } } } },
            ],
          } : {}),
        },
        select: {
          id: true,
          name: true,
          dni: true,
          tipoDocumentoCodigo: true,
          status: true,
          updatedAt: true,
          principalPatient: { select: { dni: true, user: { select: { name: true } } } },
        },
        orderBy: { updatedAt: "desc" },
        take: 100,
      });
    }),

  validateDependent: staffAuthorizationProcedure
    .input(z.object({ dependentId: z.string().min(1), status: z.enum(["ACTIVE", "REJECTED"]) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.dependent.update({
        where: { id: input.dependentId },
        data: { status: input.status },
        select: { id: true, status: true },
      });
    }),

  // Listar todo el staff médico
  list: publicProcedure.query(async () => {
    return await db.user.findMany({
      where: { role: "DOCTOR" },
      include: { professional: true },
      orderBy: { name: "asc" }
    });
  }),

  // Alta de nuevo profesional (Manual desde Admin)
  create: publicProcedure
    .input(z.object({
      firstName: z.string().min(2),
      lastName: z.string().min(2),
      licenseNumber: z.string().min(3),
      specialty: z.string(),
      phone: z.string().optional(),
      address: z.string().optional(),
      username: z.string().min(3),
      password: z.string().min(4),
    }))
    .mutation(async ({ ctx, input }) => {
      // 1. Buscamos la institución Quantum para vincular al profesional
      const institution = await ctx.db.institution.findUnique({
        where: { slug: "quantum" }
      });

      // 2. Crear el usuario con rol DOCTOR
      const user = await ctx.db.user.create({
        data: {
          name: `${input.firstName} ${input.lastName}`,
          username: input.username,
          password: input.password,
          role: "DOCTOR",
          institutionId: institution?.id, // Lo vinculamos a Quantum
        }
      });

      // 3. Crear el perfil profesional
      return await ctx.db.professional.create({
        data: {
          userId: user.id,
          licenseNumber: input.licenseNumber,
          specialty: input.specialty,
          phoneNumber: input.phone,
          address: input.address,
        }
      });
    }),

  // Eliminar profesional
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await db.user.delete({
        where: { id: input.id }
      });
    }),
});

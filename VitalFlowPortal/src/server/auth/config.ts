import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

import { db } from "~/server/db";
import { getHisPatientIdByDni } from "~/server/services/his/vitalflow-adapter";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  trustHost: true,
  providers: [
    // GoogleProvider temporarily disabled - will re-enable after testing
    // GoogleProvider({
    //     clientId: process.env.AUTH_GOOGLE_ID,
    //     clientSecret: process.env.AUTH_GOOGLE_SECRET,
    // }),
    
    // Simple Patient Login by DNI
    CredentialsProvider({
        id: "paciente-dni",
        name: "Acceso Paciente (DNI)",
        credentials: {
          dni: { label: "DNI", type: "text", placeholder: "12345678" },
          password: { label: "Contraseña", type: "password" }
        },
        async authorize(credentials) {
            if (!credentials?.dni || !credentials?.password) return null;

            try {
              const dni = String(credentials.dni).trim();
              const password = String(credentials.password).trim();
              const email = `dni-${dni}@pacientes.local`;
              const username = `paciente-${dni}`;

              let user = await db.user.findUnique({ where: { email } });
              if (!user) {
                user = await db.user.findUnique({ where: { username } });
              }

              if (user && user.password !== password) {
                console.warn(`[DNI Auth] Invalid password for DNI ${dni}`);
                return null;
              }

              let hisPatientId: string | null = null;
              try {
                hisPatientId = await getHisPatientIdByDni(dni);
              } catch (error) {
                console.warn(`[DNI Auth] HIS lookup failed for DNI ${dni}; falling back to local user validation.`, error);
              }

              if (!user) {
                if (!hisPatientId) {
                  console.warn(`[DNI Auth] DNI ${dni} does not exist in HIS and no local user match was found. Login rejected.`);
                  return null;
                }

                user = await db.user.create({
                  data: {
                    email,
                    name: `Paciente ${dni}`,
                    role: "PATIENT",
                    username,
                    password,
                  },
                });
              }

              console.log(`[DNI Auth] User: ${user.id} (${email})`);

              if (hisPatientId) {
                let patient = await db.patient.findUnique({ where: { userId: user.id } });

                if (!patient) {
                  patient = await db.patient.create({
                    data: {
                      userId: user.id,
                      hisId: hisPatientId,
                      dni,
                      onboardingCompleted: true,
                    },
                  });
                  console.log(`[DNI Auth] Created patient for user ${user.id} linked to HIS ${hisPatientId}`);
                } else {
                  const shouldUpdate = patient.dni !== dni || patient.hisId !== hisPatientId || !patient.onboardingCompleted;
                  if (shouldUpdate) {
                    patient = await db.patient.update({
                      where: { userId: user.id },
                      data: {
                        dni,
                        hisId: hisPatientId,
                        onboardingCompleted: true,
                      },
                    });
                    console.log(`[DNI Auth] Updated patient mapping for user ${user.id} -> HIS ${hisPatientId}`);
                  } else {
                    console.log(`[DNI Auth] Patient already exists for user ${user.id}`);
                  }
                }
              } else {
                let patient = await db.patient.findUnique({ where: { userId: user.id } });
                if (!patient) {
                  patient = await db.patient.create({
                    data: {
                      userId: user.id,
                      dni,
                      onboardingCompleted: true,
                    },
                  });
                  console.log(`[DNI Auth] Created patient fallback record for local user ${user.id}`);
                }
              }

              return {
                id: user.id,
                name: user.name,
                email: user.email,
                image: `https://i.pravatar.cc/150?u=${dni}`,
              };
            } catch (e) {
              console.error("[DNI Auth] Error:", e);
              return null;
            }
        }
    }),
  ],
  adapter: PrismaAdapter(db),
  pages: {
    signIn: "/auth/signin",
  },
  session: { 
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Update every 24h
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    },
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.sub ?? "",
        role: token.role as string,
      },
    }),
  },
} satisfies NextAuthConfig;

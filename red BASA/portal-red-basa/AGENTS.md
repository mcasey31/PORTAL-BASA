# VitalPlus Health Platform - AI Agent Instructions

**Project:** VitalPlus Health - Multi-tenant Healthcare SaaS Platform  
**Tech Stack:** Next.js 15, TRPC, Prisma, TypeScript, Tailwind CSS  
**Communication Language:** Spanish (Español)  
**Updated:** 2026-04-23

---

## 1. Project Overview

**VitalPlus Health** is a multi-tenant healthcare platform enabling institutions to manage patients, medical staff, telemedicine, and EHR (Electronic Health Records) through white-label sections.

**Key Sections:**
- **(corporate)** - VitalPlus marketing & institutional admin landing
- **(admin)** - B2B institutional management dashboard (staff, locations, branding)
- **(staff)** - Unified medical console (doctor portal, telemedicine, EHR)
- **(portal)** - Patient PWA (appointments, medical records, telemedicine access)
- **(tenant)** - Client-specific landing pages (white-label)

**Multi-tenant Strategy:** Shared database, shared schema, `institutionId` as the separator. Each tenant owns a domain that routes through middleware to deliver white-labeled experiences.

---

## 2. Project Structure

```
src/
├── app/                  # Next.js App Router (Route Groups)
│   ├── (corporate)/      # VitalPlus corporate section
│   ├── (admin)/          # Institutional administration dashboard
│   ├── (staff)/          # Medical staff console (doctor portal)
│   ├── (portal)/         # Patient portal & PWA
│   └── (tenant)/         # Client-specific landing pages
│
├── components/           # Reusable React components
│   ├── ui/              # Base UI components (buttons, cards, modals)
│   ├── forms/           # Form components (login, patient registration)
│   └── features/        # Feature-specific components (telemedicine, EHR)
│
├── config/              # Configuration files
│   ├── site.ts          # Site-wide config (routes, metadata)
│   └── auth.ts          # NextAuth.js configuration
│
├── lib/                 # Utility functions
│   ├── utils.ts         # General utilities (cn, formatting, helpers)
│   ├── auth.ts          # Authentication helpers
│   └── middleware/      # Request processing
│
├── server/              # Server-side code (Prisma, auth sessions)
│   ├── db.ts           # Database client initialization
│   └── auth.ts         # Authentication logic (providers, callbacks)
│
├── styles/              # Global CSS
│   └── globals.css      # Tailwind directives + custom CSS vars
│
└── trpc/                # TRPC routers
    ├── routers/         # API route definitions by feature
    └── middleware/      # TRPC middleware (auth, logging)

prisma/
├── schema.prisma        # Database schema (single source of truth)
├── seed.ts             # Database seed script
└── migrations/         # Version-controlled migrations

docs/
├── planning-artifacts/  # PRD, architecture, UX design, epics, stories
├── implementation-artifacts/ # Sprint status, test reports, ADRs
└── technical-artifacts/ # HIS integration blueprints, deployment guides
```

---

## 3. Core Tech Stack & Dependencies

| Technology | Purpose | Key Details |
|-----------|---------|------------|
| **Next.js 15** | Full-stack framework | App Router, Server Components, Turbo |
| **TRPC v11** | Type-safe RPC | Client: `@trpc/react-query`, Server: `@trpc/server` |
| **Prisma 6.6** | ORM | PostgreSQL, migrations, studio available |
| **NextAuth.js 5.0-beta** | Authentication | Credentials & OAuth providers, Prisma adapter |
| **Tailwind CSS 4** | Styling | PostCSS, tw-animate-css for animations |
| **React Query 5** | Data fetching | Used with TRPC for caching & sync |
| **Zod 3.24** | Validation | Schema validation for API inputs |
| **TypeScript 5.8** | Type safety | Strict mode enabled |
| **Shadcn/ui (Base UI)** | Component library | Pre-built accessible components |

**Key Dev Tools:**
- `tsx` - TypeScript execution for scripts
- `prisma studio` - Database UI explorer
- `next dev --turbo` - Development with Turbo for fast rebuilds

---

## 4. Multi-tenant Architecture Rules

### 4.1 Institutional Isolation (Critical)

Every database operation **MUST** filter by `institutionId`:

```typescript
// ✅ CORRECT
const patient = await db.patient.findFirst({
  where: {
    id: patientId,
    institutionId: currentInstitution.id,  // REQUIRED FILTER
  },
});

// ❌ WRONG - Missing institutionId filter
const patient = await db.patient.findFirst({
  where: { id: patientId },
});
```

**All entities linked to Institution:**
- `User` (doctors, staff, admins)
- `Patient`
- `MedicalCenter` (facility locations)
- `TelemedicineCall`
- `MedicalRecord`

### 4.2 Middleware Routing

The middleware (`src/middleware.ts`) determines which section loads based on `hostname`:

- **vitalplushealth.com** → corporate section
- **[customDomain]** (e.g., quantuminstitucionsalud.com.ar) → tenant section
- **/admin** paths → admin dashboard (institution management)
- **/staff/console** paths → medical console (staff section)
- **/dashboard** paths → patient portal

When implementing routes, verify the correct route group:
```
src/app/(corporate)/path     // Corporate landing
src/app/(admin)/admin/path   // Admin dashboard
src/app/(staff)/console/path // Medical console
src/app/(portal)/dashboard   // Patient portal
```

### 4.3 Branding & White-label

Each institution has `customization`:
```typescript
Institution {
  customDomain: string,      // e.g., "quantum.com.ar"
  branding: {
    logoUrl: string,
    primaryColor: string,    // CSS color value
    secondaryColor: string,
  }
}
```

Inject colors via CSS variables in layout:
```typescript
<style>{`
  :root {
    --primary: ${institution.branding.primaryColor};
    --secondary: ${institution.branding.secondaryColor};
  }
`}</style>
```

---

## 5. Authentication & Authorization

### 5.1 Role-Based Access Control (RBAC)

**User Roles:**
- `ADMIN` - Institutional administrators (manage staff, config)
- `DOCTOR` - Medical professionals (telemedicine, EHR)
- `STAFF` - Support/reception (patient queues, scheduling)
- `PATIENT` - Patient self-service portal

**Auth Status:**
- Staff login: `/staff/login` (unified for doctors & staff)
- Patient login: `/login` (portal)
- NextAuth.js with credentials provider + optional OAuth

### 5.2 Protected Routes

Middleware protects routes by role:
```typescript
// Example: Doctor console requires DOCTOR role
const user = await getServerSession(); // From NextAuth
if (user.role !== "DOCTOR") {
  redirect("/");  // Unauthorized
}
```

**Implement role checks:**
- In route handlers (server components)
- In TRPC middleware `procedure.use(isAuthenticated, hasRole("DOCTOR"))`
- In client-side guards (but always validate on server!)

---

## 6. TRPC Router Pattern

All API operations go through TRPC for type safety.

**Structure:**
```typescript
// src/trpc/routers/patient.ts
export const patientRouter = createTRPCRouter({
  getProfile: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      return db.patient.findUniqueOrThrow({
        where: { id: input.id, institutionId: ctx.institutionId },
      });
    }),

  update: protectedProcedure
    .input(patientUpdateSchema)
    .mutation(async ({ input, ctx }) => {
      return db.patient.update({
        where: { id: input.id, institutionId: ctx.institutionId },
        data: input,
      });
    }),
});

// Root: src/trpc/root.ts
export const appRouter = createTRPCRouter({
  patient: patientRouter,
  // ... other routers
});
```

**Key Rules:**
1. Always validate input with Zod schemas
2. Always filter by `institutionId` in queries
3. Use `protectedProcedure` for staff/patient auth walls
4. Return only data the user owns/can access

---

## 7. Prisma Schema Patterns

**Multi-tenant Entity Pattern:**
```prisma
model Patient {
  id        String   @id @default(cuid())
  institutionId String // ← REQUIRED for all multi-tenant entities
  institution   Institution @relation(fields: [institutionId], references: [id], onDelete: Cascade)
  
  name      String
  email     String @unique
  phone     String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([institutionId, email])  // Compound unique within institution
  @@index([institutionId])
}
```

**Unique Constraints:**
- Use compound constraints: `@@unique([institutionId, email])`
- This allows the same email across different institutions

---

## 8. Development Commands

```bash
# Install dependencies
npm install

# Database operations
npm run db:push          # Push schema changes to DB
npm run db:migrate      # Run migrations
npm run db:studio       # Open Prisma studio GUI
npm run db:seed:quantum # Seed test data

# Development
npm run dev             # Start dev server (with Turbo)
npm run dev:mobile      # Dev server accessible from mobile (0.0.0.0)

# Production
npm run build           # Build for production
npm run start           # Start production server
npm run preview         # Build + preview

# Validation
npm run typecheck       # Type checking without emit
```

---

## 9. Common Development Patterns

### 9.1 Fetching Data in Server Components

```typescript
// ✅ Server component (safe to fetch directly from DB)
async function PatientCard({ patientId }: { patientId: string }) {
  const patient = await db.patient.findUniqueOrThrow({
    where: { id: patientId, institutionId: getCurrentInstitutionId() },
  });
  
  return <div>{patient.name}</div>;
}
```

### 9.2 Client-Side Data with TRPC

```typescript
// ✅ Client component with TRPC hook
function PatientList() {
  const { data, isLoading } = trpc.patient.list.useQuery();
  
  if (isLoading) return <div>Loading...</div>;
  return <ul>{data?.map(p => <li key={p.id}>{p.name}</li>)}</ul>;
}
```

### 9.3 Form Handling

Use Zod + React Hook Form:
```typescript
const patientSchema = z.object({
  name: z.string().min(1, "Required"),
  email: z.string().email(),
  phone: z.string().optional(),
});

function UpdatePatientForm({ patientId }: { patientId: string }) {
  const form = useForm<z.infer<typeof patientSchema>>({
    resolver: zodResolver(patientSchema),
  });

  const updateMutation = trpc.patient.update.useMutation();

  const onSubmit = async (data) => {
    await updateMutation.mutateAsync({ id: patientId, ...data });
  };

  return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>;
}
```

---

## 10. Key Conventions

### 10.1 Naming

- **Routes:** kebab-case (e.g., `/staff/medical-console`)
- **Components:** PascalCase (e.g., `PatientCard.tsx`)
- **Functions:** camelCase (e.g., `fetchPatientData()`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `PATIENT_STATUSES`)
- **Files:** Match export name (e.g., `PatientCard.tsx` exports `PatientCard`)

### 10.2 File Organization

```
src/
├── app/
│   └── (staff)/
│       └── console/
│           ├── page.tsx          # Route component
│           ├── layout.tsx        # Local layout
│           └── components/       # Page-specific components
│
├── components/
│   ├── ui/Button.tsx             # Reusable UI component
│   └── PatientCard.tsx           # Feature component used in multiple places
```

### 10.3 Imports

- Use path aliases: `@/components`, `@/lib`, `@/server`
- Group imports: React → third-party → local
- Use destructuring for clarity

```typescript
import { useMemo } from "react";
import { format } from "date-fns";
import { db } from "@/server/db";
import { PatientCard } from "@/components/PatientCard";
```

### 10.4 Error Handling

Use Zod's `.parse()` or `.safeParse()`:
```typescript
// Throws if invalid
const validated = schema.parse(input);

// Returns { success: boolean, data?, error? }
const result = schema.safeParse(input);
if (!result.success) {
  throw new Error(result.error.message);
}
```

---

## 11. Critical Pitfalls to Avoid

### ❌ Pitfall 1: Missing institutionId Filter

```typescript
// WRONG - Could expose other institutions' data
const records = await db.medicalRecord.findMany({
  where: { patientId: patientId }
});

// RIGHT - Always filter by institutionId
const records = await db.medicalRecord.findMany({
  where: {
    patientId: patientId,
    patient: { institutionId: ctx.institutionId },
  },
});
```

### ❌ Pitfall 2: Unvalidated User Input

```typescript
// WRONG - Input not validated
trpc.router.mutation(async ({ input }) => {
  return db.patient.update({ where: { id: input.id }, data: input });
});

// RIGHT - Always validate with Zod
import { z } from "zod";

trpc.router.mutation(
  .input(z.object({ id: z.string(), name: z.string().min(1) }))
  .mutation(async ({ input, ctx }) => {
    return db.patient.update({ where: { id: input.id }, data: { name: input.name } });
  })
);
```

### ❌ Pitfall 3: Exposing Sensitive Data in Responses

```typescript
// WRONG - Exposes password hash
const user = await db.user.findUnique({ where: { id: userId } });
return user; // Includes password!

// RIGHT - Select safe fields
const user = await db.user.findUnique({
  where: { id: userId },
  select: { id: true, name: true, email: true, role: true },
});
```

### ❌ Pitfall 4: Wrong Route Group

Routes must be in the correct section:
- Doctor login → `(staff)` section
- Patient login → `(portal)` section
- Admin config → `(admin)` section

### ❌ Pitfall 5: Client-Only Logic with Database Access

```typescript
// WRONG - This is a client component, can't access DB
"use client";
import { db } from "@/server/db";
export function PatientList() {
  const patients = db.patient.findMany(); // ERROR!
}

// RIGHT - Fetch via TRPC or server component
export async function PatientList() {
  const patients = await db.patient.findMany({ where: { ... } });
  return <ul>...</ul>;
}
```

---

## 12. Useful Patterns for Common Tasks

### List all patients for current institution (with TRPC)

```typescript
// Server: src/trpc/routers/patient.ts
export const patientRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.patient.findMany({
      where: { institutionId: ctx.institutionId },
      orderBy: { createdAt: "desc" },
    });
  }),
});

// Client: Use hook
const { data: patients } = trpc.patient.list.useQuery();
```

### Validate staff role before operation

```typescript
export const staffProcedure = protectedProcedure
  .use(async (opts) => {
    if (!["ADMIN", "DOCTOR", "STAFF"].includes(opts.ctx.user.role)) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return opts.next();
  });
```

### Format dates consistently

```typescript
import { format } from "date-fns";

export const formatDateTime = (date: Date) => 
  format(date, "dd/MM/yyyy HH:mm");

export const formatDate = (date: Date) => 
  format(date, "dd/MM/yyyy");
```

---

## 13. Documentation References

- [Architecture Overview](docs/planning-artifacts/architecture.md) - Multi-tenant design decisions
- [Product Backlog](docs/planning-artifacts/product-backlog.md) - Current priorities & sprint status
- [HIS Integration Blueprint](docs/technical-artifacts/his-integration-blueprint.md) - Third-party EHR connections
- [Next.js Docs](https://nextjs.org) - App Router, Server Components
- [TRPC Docs](https://trpc.io) - Type-safe API patterns
- [Prisma Docs](https://prisma.io) - ORM queries, migrations

---

## 14. When You're Stuck

**Common solutions by scenario:**

| Scenario | Solution |
|----------|----------|
| "What's the current database schema?" | `npm run db:studio` opens visual explorer |
| "How do I call the API?" | Use TRPC hooks in client components |
| "Route not found?" | Check correct app route group `(corporate)`, `(admin)`, `(staff)`, `(portal)` |
| "Getting 'institutionId is required' error" | Add `institutionId` filter to all DB queries |
| "Component won't re-render?" | Use `useQuery` hook for reactive data, check React Suspense |
| "Type errors on API call?" | TRPC provides full type hints—hover over function call |

---

## 15. Next Steps for New Agents

1. **Read the architecture document** → `docs/planning-artifacts/architecture.md`
2. **Review the product backlog** → `docs/planning-artifacts/product-backlog.md`
3. **Inspect Prisma schema** → `prisma/schema.prisma`
4. **Check current sprint status** → `docs/implementation-artifacts/sprint-status.yaml` (if exists)
5. **Start with a small task** → Create a patient list view, add a form field, implement a TRPC mutation

---

**Questions?** Refer to the BMAD workflow system (`_bmad/`) for structured task execution, or reach out to the team.

¡Gracias! 🚀

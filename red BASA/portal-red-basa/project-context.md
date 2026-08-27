# VitalPlus Health - Project Context for AI Agents

**Quick Reference for LLM Implementation Consistency**

---

## Critical Rules (Non-negotiable)

### 1. Multi-tenant Data Isolation

**Every database query MUST include institutionId filter:**

```typescript
// Template for all DB queries:
db.entity.findMany({
  where: {
    institutionId: ctx.institutionId,  // ← ALWAYS ADD THIS
    // ... other filters
  }
})
```

**Why?** Missing this filter exposes one institution's data to another. It's a critical security issue.

---

### 2. Role-Based Route Access

Routes must validate user roles **server-side** before rendering:

```typescript
// Required in server components or route handlers:
const session = await getServerSession();
if (session.user.role !== "DOCTOR") {
  redirect("/unauthorized");
}
```

**Staff Roles:**
- `ADMIN` → Can manage institution config, staff, branding
- `DOCTOR` → Can access medical console, telemedicine, EHR
- `STAFF` → Can manage patient queues, appointments
- `PATIENT` → Patient self-service portal only

---

### 3. TRPC Input Validation (Always)

Every mutation and query **must validate input with Zod**:

```typescript
// WRONG
export const update = protectedProcedure.mutation(async ({ input }) => {
  // input is any, no validation
})

// RIGHT
export const update = protectedProcedure
  .input(z.object({ id: z.string(), name: z.string().min(1) }))
  .mutation(async ({ input }) => {
    // input is fully typed and validated
  })
```

---

### 4. Never Expose Sensitive Fields

Always use `.select()` to return only safe fields:

```typescript
// WRONG - Returns password hash, tokens, etc.
const user = await db.user.findUnique({ where: { id } });

// RIGHT - Returns only safe fields
const user = await db.user.findUnique({
  where: { id },
  select: { id: true, name: true, email: true, role: true }
});
```

---

## Route Structure Reference

```
Next.js Route Groups (must use correct group):

/                              → (corporate) landing page
/admin/*                       → (admin) institutional management
/staff/console                 → (staff) medical console (doctor portal)
/dashboard/*                   → (portal) patient portal PWA
```

**When implementing routes:**
1. Check if it belongs to corporate, admin, staff, or patient section
2. Place in correct app route group: `src/app/(section)/path/page.tsx`
3. Verify middleware routing in comments if unsure

---

## Database Schema Quick Reference

```prisma
// All multi-tenant entities must have:
model Entity {
  id            String @id @default(cuid())
  institutionId String  // ← REQUIRED
  institution   Institution @relation(fields: [institutionId], references: [id], onDelete: Cascade)
  
  // Business fields...
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([institutionId, uniqueField])  // Use compound constraints
  @@index([institutionId])
}
```

**Current Entity Family:**
- `Institution` (tenant)
- `User` (staff/admin)
- `Patient` (patients)
- `MedicalCenter` (facility locations)
- `TelemedicineCall` (consultation sessions)
- `MedicalRecord` (patient EHR data)

---

## Common Implementation Patterns

### Fetch & Display Patient List

```typescript
// Server component (can query DB directly)
async function PatientListPage() {
  const institution = getCurrentInstitution(); // From middleware
  const patients = await db.patient.findMany({
    where: { institutionId: institution.id },
    select: { id: true, name: true, email: true, phone: true },
    orderBy: { createdAt: "desc" }
  });
  return <PatientTable data={patients} />;
}
```

### Add TRPC Mutation

```typescript
// src/trpc/routers/patient.ts
export const patientRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ name: z.string(), email: z.string().email() }))
    .mutation(async ({ input, ctx }) => {
      return db.patient.create({
        data: { ...input, institutionId: ctx.institutionId }
      });
    })
});

// Usage in client component
function CreatePatientForm() {
  const create = trpc.patient.create.useMutation();
  const onSubmit = async (data) => {
    await create.mutateAsync(data);
  };
  return <form onSubmit={...}>...</form>;
}
```

### Validate Staff Access

```typescript
// Middleware for staff-only operations
export const staffProcedure = protectedProcedure
  .use(async (opts) => {
    if (!["ADMIN", "DOCTOR", "STAFF"].includes(opts.ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return opts.next();
  });

// Use it
export const patientRouter = createTRPCRouter({
  updateQueue: staffProcedure.mutation(async ({ ctx }) => {
    // Only ADMIN, DOCTOR, or STAFF can execute
  })
});
```

---

## Dev Commands (Copy-Paste Ready)

```bash
# Start development server
npm run dev

# Open database UI
npm run db:studio

# Push schema changes
npm run db:push

# Run type checking
npm run typecheck

# Seed test data
npm run db:seed:quantum

# Build for production
npm run build

# Start production server
npm run start
```

---

## What Happens When You Violate These Rules

| Violation | Consequence |
|-----------|------------|
| Query without `institutionId` filter | **Security breach** - Another institution sees your data |
| Skip role validation on route | **Unauthorized access** - Users access sections they shouldn't |
| Missing Zod validation | **Type errors at runtime** - Bad data corrupts database |
| Expose password/token in API | **Account takeover** - Credentials leaked to client |
| Place route in wrong group | **Route doesn't work** - Middleware confusion, 404 |

---

## File Locations (Quick Ref)

```
src/app/                    # Routes (organize by route group)
src/components/             # Reusable React components
src/server/db.ts           # Prisma client
src/server/auth.ts         # NextAuth setup
src/trpc/                  # API routers (organized by feature)
prisma/schema.prisma       # Database schema
docs/planning-artifacts/   # Architecture, PRD, epics, stories
docs/implementation-artifacts/ # Sprint status, test reports
```

---

## Links to Full Documentation

- **Architecture Details** → [Architecture.md](docs/planning-artifacts/architecture.md)
- **Database Schema** → [prisma/schema.prisma](prisma/schema.prisma)
- **Current Sprint** → [Product Backlog](docs/planning-artifacts/product-backlog.md)
- **HIS Integration** → [HIS Blueprint](docs/technical-artifacts/his-integration-blueprint.md)

---

## Debugging Checklist

When things break, check in this order:

- [ ] Is `institutionId` included in all database queries?
- [ ] Is the user's role validated before accessing sensitive routes?
- [ ] Are all TRPC inputs validated with Zod schemas?
- [ ] Are sensitive fields being filtered with `.select()`?
- [ ] Is the route in the correct app route group?
- [ ] Does the component/route use `"use client"` if it needs interactivity?
- [ ] Are environment variables loaded correctly?
- [ ] Is the database running and accessible?

---

## Remember

1. **Security First** - Every line of code touches patient data. Assume breach until proven otherwise.
2. **Type Safety** - Use TypeScript strictly. Let the compiler catch mistakes.
3. **Validation Always** - Trust nothing from the client, always validate input.
4. **Test Thoroughly** - Manually test role isolation, multi-tenant data separation, auth flows.
5. **Ask Questions** - If unsure about a pattern, refer to existing code or documentation.

---

**Last Updated:** April 23, 2026  
**Language:** Español (Spanish)  
**Status:** Active Development (Phase 2 - Planning → Implementation)

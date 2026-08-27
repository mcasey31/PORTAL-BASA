import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const profile = {
    dni: '27483779',
    email: 'dni-27483779@pacientes.local',
    username: 'paciente-27483779',
    password: 'P@ss1234',
    hisId: '27483779-0000-4000-8000-000000000001',
    name: 'Paciente 27483779',
  };

  const user = await prisma.user.upsert({
    where: { email: profile.email },
    update: {
      username: profile.username,
      password: profile.password,
      role: 'PATIENT',
      name: profile.name,
    },
    create: {
      email: profile.email,
      username: profile.username,
      password: profile.password,
      role: 'PATIENT',
      name: profile.name,
    },
  });

  const patient = await prisma.patient.upsert({
    where: { userId: user.id },
    update: {
      dni: profile.dni,
      hisId: profile.hisId,
      onboardingCompleted: true,
    },
    create: {
      userId: user.id,
      dni: profile.dni,
      hisId: profile.hisId,
      onboardingCompleted: true,
    },
  });

  console.log(JSON.stringify({
    ok: true,
    user: { id: user.id, email: user.email, username: user.username, role: user.role },
    patient: {
      id: patient.id,
      userId: patient.userId,
      dni: patient.dni,
      hisId: patient.hisId,
      onboardingCompleted: patient.onboardingCompleted,
    },
  }, null, 2));
}

main()
  .catch((error) => {
    console.error('USER_CREATE_FAILED');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

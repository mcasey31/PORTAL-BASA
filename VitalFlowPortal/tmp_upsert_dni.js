const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const dni = '27483779';
  const email = 'dni-27483779@pacientes.local';
  const username = 'paciente-27483779';
  const password = '27483779';
  const hisId = '27483779-0000-4000-8000-000000000001';

  const user = await prisma.user.upsert({
    where: { email },
    update: { username, password, role: 'PATIENT', name: Paciente  },
    create: { email, username, password, role: 'PATIENT', name: Paciente  }
  });

  const patient = await prisma.patient.upsert({
    where: { userId: user.id },
    update: { dni, hisId, onboardingCompleted: true },
    create: { userId: user.id, dni, hisId, onboardingCompleted: true }
  });

  console.log(JSON.stringify({
    user: { id: user.id, email: user.email, username: user.username, role: user.role },
    patient: { id: patient.id, userId: patient.userId, dni: patient.dni, hisId: patient.hisId, onboardingCompleted: patient.onboardingCompleted }
  }, null, 2));
}

run().catch((e) => { console.error(e); process.exit(1); });

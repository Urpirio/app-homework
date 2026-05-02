import 'dotenv/config';
import { PrismaClient, NotificationType, TaskStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seeding...');

  // 1. Clean database
  await prisma.notification.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Test User
  const hashedPassword = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      password: hashedPassword,
      fullName: 'John Doe',
      role: 'Project Manager',
      avatarUrl: 'https://ui-avatars.com/api/?name=John+Doe&background=007AFF&color=fff',
    },
  });

  console.log('✅ User created: test@example.com / password123');

  // 3. Create Projects
  const project1 = await prisma.project.create({
    data: {
      name: 'Rediseño de App Móvil',
      description: 'Renovación completa de la UI/UX y migración a Expo Router v3.',
      color: '#007AFF',
      userId: user.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'Dashboard Administrativo',
      description: 'Panel de control para la gestión de usuarios y analíticas.',
      color: '#5856D6',
      userId: user.id,
    },
  });

  const project3 = await prisma.project.create({
    data: {
      name: 'Campaña de Marketing 2024',
      description: 'Estrategia digital para el lanzamiento del Q4.',
      color: '#FF9500',
      userId: user.id,
    },
  });

  console.log('✅ 3 Projects created');

  // 4. Create Tasks for Project 1
  await prisma.task.createMany({
    data: [
      {
        title: 'Definir arquitectura de navegación',
        description: 'Configurar tabs y stacks en Expo Router.',
        status: TaskStatus.DONE,
        projectId: project1.id,
      },
      {
        title: 'Diseñar paleta de colores premium',
        description: 'Usar HSL para el modo oscuro y claro.',
        status: TaskStatus.DONE,
        projectId: project1.id,
      },
      {
        title: 'Implementar animaciones con Reanimated',
        description: 'Agregar micro-interacciones en los botones.',
        status: TaskStatus.IN_PROGRESS,
        projectId: project1.id,
      },
      {
        title: 'Pruebas de rendimiento en Android',
        status: TaskStatus.TODO,
        projectId: project1.id,
      },
    ],
  });

  // Tasks for Project 2
  await prisma.task.createMany({
    data: [
      {
        title: 'Configurar conexión con base de datos',
        status: TaskStatus.DONE,
        projectId: project2.id,
      },
      {
        title: 'Crear endpoints de analíticas',
        status: TaskStatus.TODO,
        projectId: project2.id,
      },
    ],
  });

  console.log('✅ Tasks created');

  // 5. Create Initial Notifications
  await prisma.notification.createMany({
    data: [
      {
        title: 'Bienvenido a Homework',
        message: 'Tu cuenta ha sido creada con éxito. ¡Empieza a gestionar tus proyectos!',
        type: NotificationType.PROJECT,
        userId: user.id,
        read: true,
      },
      {
        title: 'Nueva Tarea Asignada',
        message: 'Se te ha asignado "Implementar animaciones" en Rediseño App.',
        type: NotificationType.TASK,
        userId: user.id,
        read: false,
      },
      {
        title: 'Fecha Límite Próxima',
        message: 'La campaña de Marketing vence en 3 días.',
        type: NotificationType.ALERT,
        userId: user.id,
        read: false,
      },
    ],
  });

  console.log('✅ Notifications created');
  console.log('✨ Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

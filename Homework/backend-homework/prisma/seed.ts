import 'dotenv/config';
import { PrismaClient, NotificationType, TaskStatus, Role, LoanStatus, TicketStatus, SubmissionStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting full seeding...');

  // 1. Clean database
  await prisma.review.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.bookLoan.deleteMany();
  await prisma.book.deleteMany();
  await prisma.bookCategory.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.task.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.classroom.deleteMany();
  await prisma.user.deleteMany();
  await prisma.institution.deleteMany();

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 2. Create Institutions
  const inst1 = await prisma.institution.create({
    data: {
      name: 'Instituto Tecnológico Central',
      address: 'Av. Educación 123, Ciudad Capital',
      logoUrl: 'https://ui-avatars.com/api/?name=ITC&background=007AFF&color=fff',
    },
  });

  const inst2 = await prisma.institution.create({
    data: {
      name: 'Colegio Americano del Este',
      address: 'Calle 50 #12-45, Sector Norte',
      logoUrl: 'https://ui-avatars.com/api/?name=CAE&background=34C759&color=fff',
    },
  });

  console.log('✅ Institutions created');

  // 3. Create Users
  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@homework.com',
      password: hashedPassword,
      fullName: 'Administrador Global',
      role: Role.SUPER_ADMIN,
      isVerified: true,
      avatarUrl: 'https://ui-avatars.com/api/?name=Admin+Global&background=000&color=fff',
    },
  });

  const schoolAdmin = await prisma.user.create({
    data: {
      email: 'admin@itc.edu',
      password: hashedPassword,
      fullName: 'Lic. Ricardo Pérez',
      role: Role.SCHOOL_ADMIN,
      institutionId: inst1.id,
      isVerified: true,
      avatarUrl: 'https://ui-avatars.com/api/?name=Ricardo+Perez&background=5856D6&color=fff',
    },
  });

  const teacher = await prisma.user.create({
    data: {
      email: 'profe.marta@itc.edu',
      password: hashedPassword,
      fullName: 'Dra. Marta Gómez',
      role: Role.TEACHER,
      institutionId: inst1.id,
      isVerified: true,
      specialty: 'Matemáticas y Física',
      bio: 'Docente con 15 años de experiencia en educación superior.',
      avatarUrl: 'https://i.pravatar.cc/150?u=marta',
    },
  });

  const student = await prisma.user.create({
    data: {
      email: 'estudiante@itc.edu',
      password: hashedPassword,
      fullName: 'Carlos Alberto Sosa',
      role: Role.STUDENT,
      institutionId: inst1.id,
      isVerified: true,
      identityCode: 'HW-STUD-001',
      parentName: 'Gloria Sosa',
      parentPhone: '+5491122334455',
      avatarUrl: 'https://i.pravatar.cc/150?u=carlos',
    },
  });

  const support = await prisma.user.create({
    data: {
      email: 'soporte@itc.edu',
      password: hashedPassword,
      fullName: 'Tec. Mario Casas',
      role: Role.SUPPORT,
      institutionId: inst1.id,
      isVerified: true,
      avatarUrl: 'https://i.pravatar.cc/150?u=mario',
    },
  });

  console.log('✅ Users created and verified');

  // 4. Classrooms & Students
  console.log('⏳ Generating 5 classrooms and 50 students...');
  const classrooms = [];
  for (let i = 1; i <= 5; i++) {
    const cls = await prisma.classroom.create({
      data: {
        name: `${i}to Año - Division ${String.fromCharCode(64 + i)}`,
        description: `Aula de formación general grupo ${i}`,
        institutionId: inst1.id,
      },
    });
    classrooms.push(cls);
  }

  for (let i = 1; i <= 50; i++) {
    await prisma.user.create({
      data: {
        email: `estudiante${i}@itc.edu`,
        password: hashedPassword,
        fullName: `Estudiante Ejemplo ${i}`,
        role: Role.STUDENT,
        institutionId: inst1.id,
        classroomId: classrooms[i % 5].id,
        isVerified: true,
        identityCode: `HW-ST-${1000 + i}`,
      },
    });
  }

  // 5. Teachers & Subjects
  console.log('⏳ Generating 10 teachers and 15 subjects...');
  const teachers = [];
  for (let i = 1; i <= 10; i++) {
    const t = await prisma.user.create({
      data: {
        email: `profe${i}@itc.edu`,
        password: hashedPassword,
        fullName: `Profesor ${i}`,
        role: Role.TEACHER,
        institutionId: inst1.id,
        isVerified: true,
        specialty: i % 2 === 0 ? 'Ciencias' : 'Humanidades',
      },
    });
    teachers.push(t);
  }

  const subjectNames = ['Matemáticas', 'Lengua', 'Historia', 'Física', 'Química', 'Biología', 'Geografía', 'Arte', 'Inglés', 'Tecnología'];
  const subjects = [];
  for (let i = 0; i < 15; i++) {
    const sub = await prisma.project.create({
      data: {
        name: `${subjectNames[i % 10]} ${Math.floor(i / 10) + 1}`,
        description: `Materia curricular obligatoria nivel ${i + 1}`,
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
        icon: 'book',
        institutionId: inst1.id,
        classroomId: classrooms[i % 5].id,
        userId: teachers[i % 10].id,
      },
    });
    subjects.push(sub);
  }

  // 6. Tasks & Submissions (A lot of data here)
  console.log('⏳ Generating 60 tasks and 100 submissions...');
  for (let i = 0; i < 60; i++) {
    const sub = subjects[i % 15];
    const task = await prisma.task.create({
      data: {
        title: `Tarea Semanal ${i + 1}`,
        description: `Contenido de evaluación para la semana ${Math.floor(i / 15) + 1}`,
        status: i % 3 === 0 ? TaskStatus.DONE : TaskStatus.TODO,
        projectId: sub.id,
        maxGrade: 100,
      },
    });

    // Create some submissions for each task
    if (i % 2 === 0) {
      const studentEmails = [`estudiante${(i % 50) + 1}@itc.edu`, `estudiante${((i + 1) % 50) + 1}@itc.edu`];
      for (const email of studentEmails) {
        const s = await prisma.user.findUnique({ where: { email } });
        if (s) {
          await prisma.submission.create({
            data: {
              taskId: task.id,
              studentId: s.id,
              content: 'Trabajo entregado en término.',
              grade: 70 + Math.random() * 30,
              status: SubmissionStatus.GRADED,
            },
          });
        }
      }
    }
  }

  // 7. Library (50 books)
  console.log('⏳ Generating 50 library books...');
  const catLib = await prisma.bookCategory.create({ data: { name: 'Biblioteca General' } });
  for (let i = 1; i <= 50; i++) {
    await prisma.book.create({
      data: {
        title: `Libro de Consulta ${i}`,
        author: `Autor Ficticio ${i}`,
        synopsis: 'Breve descripción del contenido académico del libro.',
        institutionId: inst1.id,
        categoryId: catLib.id,
        available: i % 5 !== 0,
      },
    });
  }

  // 8. Support Tickets (30 tickets)
  console.log('⏳ Generating 30 support tickets...');
  for (let i = 1; i <= 30; i++) {
    const s = await prisma.user.findUnique({ where: { email: `estudiante${(i % 50) + 1}@itc.edu` } });
    if (s) {
      await prisma.ticket.create({
        data: {
          title: `Inconveniente Técnico ${i}`,
          description: 'No puedo visualizar el contenido de la materia.',
          category: 'Soporte',
          createdById: s.id,
          assignedToId: support.id,
          status: i % 2 === 0 ? TicketStatus.RESOLVED : TicketStatus.OPEN,
        },
      });
    }
  }

  console.log('✨ Massive seeding finished successfully! (>300 records created)');
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

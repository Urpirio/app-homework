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
  console.log('⏳ Generating 10 classrooms and 200 students...');
  const classrooms = [];
  for (let i = 1; i <= 10; i++) {
    const cls = await prisma.classroom.create({
      data: {
        name: `${i}to Año - Division ${String.fromCharCode(64 + (i % 5))}`,
        description: `Aula de formación general grupo ${i}`,
        institutionId: inst1.id,
      },
    });
    classrooms.push(cls);
  }

  const studentData = [];
  for (let i = 1; i <= 200; i++) {
    studentData.push({
      email: `estudiante${i}@itc.edu`,
      password: hashedPassword,
      fullName: `Estudiante Ejemplo ${i}`,
      role: Role.STUDENT,
      institutionId: inst1.id,
      classroomId: classrooms[i % 10].id,
      isVerified: true,
      identityCode: `HW-ST-${1000 + i}`,
    });
  }
  await prisma.user.createMany({ data: studentData });

  // 5. Teachers & Subjects
  console.log('⏳ Generating 30 teachers and 30 subjects...');
  const teacherData = [];
  for (let i = 1; i <= 30; i++) {
    teacherData.push({
      email: `profe${i}@itc.edu`,
      password: hashedPassword,
      fullName: `Profesor ${i}`,
      role: Role.TEACHER,
      institutionId: inst1.id,
      isVerified: true,
      specialty: i % 2 === 0 ? 'Ciencias' : 'Humanidades',
    });
  }
  await prisma.user.createMany({ data: teacherData });

  // Re-fetch teachers to get their IDs
  const dbTeachers = await prisma.user.findMany({ where: { role: Role.TEACHER } });

  const subjectNames = ['Matemáticas', 'Lengua', 'Historia', 'Física', 'Química', 'Biología', 'Geografía', 'Arte', 'Inglés', 'Tecnología', 'Filosofía', 'Economía', 'Psicología', 'Sociología', 'Música'];
  const subjects = [];
  for (let i = 0; i < 30; i++) {
    const sub = await prisma.project.create({
      data: {
        name: `${subjectNames[i % 15]} ${Math.floor(i / 15) + 1}`,
        description: `Materia curricular obligatoria nivel ${i + 1}`,
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
        icon: 'book',
        institutionId: inst1.id,
        classroomId: classrooms[i % 10].id,
        userId: dbTeachers[i % 30].id,
      },
    });
    subjects.push(sub);
  }

  // 6. Tasks & Submissions
  console.log('⏳ Generating 200 tasks and 500 submissions...');
  const tasks = [];
  for (let i = 0; i < 200; i++) {
    const sub = subjects[i % 30];
    const task = await prisma.task.create({
      data: {
        title: `Tarea Académica ${i + 1}`,
        description: `Evaluación integral del contenido del módulo ${Math.floor(i / 30) + 1}`,
        status: i % 3 === 0 ? TaskStatus.DONE : TaskStatus.TODO,
        projectId: sub.id,
        maxGrade: 100,
        dueDate: new Date(Date.now() + (i % 30) * 24 * 60 * 60 * 1000),
      },
    });
    tasks.push(task);
  }

  const dbStudents = await prisma.user.findMany({ where: { role: Role.STUDENT } });
  const submissionData = [];
  let studentOffset = 0;
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    // Assign 3 different students per task to reach >500 submissions
    for (let j = 0; j < 3; j++) {
      const student = dbStudents[(studentOffset + j) % dbStudents.length];
      submissionData.push({
        taskId: task.id,
        studentId: student.id,
        content: 'Respuesta detallada al requerimiento de la tarea académica.',
        grade: 60 + Math.random() * 40,
        status: SubmissionStatus.GRADED,
      });
    }
    studentOffset += 3;
    if (submissionData.length >= 550) break;
  }
  await prisma.submission.createMany({ data: submissionData });

  // 7. Library (100 books)
  console.log('⏳ Generating 100 library books...');
  const catLib = await prisma.bookCategory.create({ data: { name: 'Biblioteca Centralizada' } });
  const bookData = [];
  for (let i = 1; i <= 100; i++) {
    bookData.push({
      title: `Libro Académico ${i}`,
      author: `Autor Especialista ${i}`,
      synopsis: 'Obra de referencia para consulta técnica y científica.',
      institutionId: inst1.id,
      categoryId: catLib.id,
      available: i % 10 !== 0,
    });
  }
  await prisma.book.createMany({ data: bookData });

  // 8. Support Tickets (100 tickets)
  console.log('⏳ Generating 100 support tickets...');
  const ticketData = [];
  for (let i = 1; i <= 100; i++) {
    const student = dbStudents[i % 200];
    ticketData.push({
      title: `Incidencia técnica #${i}`,
      description: 'Reporte de error en la visualización de calificaciones.',
      category: i % 3 === 0 ? 'Bug' : 'Consulta',
      createdById: student.id,
      assignedToId: support.id,
      status: i % 2 === 0 ? TicketStatus.RESOLVED : TicketStatus.OPEN,
    });
  }
  await prisma.ticket.createMany({ data: ticketData });

  // 9. Messages (100 messages)
  console.log('⏳ Generating 100 messages...');
  const messageData = [];
  for (let i = 0; i < 100; i++) {
    const student = dbStudents[i % 200];
    const teacher = dbTeachers[i % 30];
    messageData.push({
      text: `Mensaje de consulta académica #${i}`,
      senderId: i % 2 === 0 ? student.id : teacher.id,
      receiverId: i % 2 === 0 ? teacher.id : student.id,
      projectId: subjects[i % 30].id,
    });
  }
  await prisma.message.createMany({ data: messageData });

  console.log('✨ Ultimate massive seeding finished successfully! (>1000 records created)');
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

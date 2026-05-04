import { PrismaPg } from '@prisma/adapter-pg';
import {
  CollaboratorStatus,
  LoanStatus,
  NotificationType,
  PrismaClient,
  Role,
  SubmissionStatus,
  TaskStatus,
  TaskType,
  TicketStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─── Helpers ─────────────────────────────────────────────────────────────────

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

const COLORS = [
  '#007AFF', '#34C759', '#FF9500', '#FF3B30', '#5856D6',
  '#AF52DE', '#FF2D55', '#00C7BE', '#30B0C7', '#32ADE6',
  '#FFD60A', '#FF6482', '#64D2FF', '#BF5AF2', '#AC8E68',
];

const SUBJECT_NAMES = [
  'Matemáticas', 'Lengua y Literatura', 'Historia', 'Física', 'Química',
  'Biología', 'Geografía', 'Arte y Diseño', 'Inglés', 'Tecnología',
  'Filosofía', 'Economía', 'Psicología', 'Sociología', 'Música',
  'Educación Física', 'Informática', 'Derecho', 'Contabilidad', 'Estadística',
];

const FIRST_NAMES = [
  'Sofía', 'Valentina', 'Isabella', 'Camila', 'Luciana',
  'Martina', 'Catalina', 'Emma', 'Victoria', 'Renata',
  'Santiago', 'Mateo', 'Sebastián', 'Nicolás', 'Alejandro',
  'Samuel', 'Daniel', 'Benjamín', 'Diego', 'Tomás',
  'Mariana', 'Gabriela', 'Andrea', 'Paula', 'Daniela',
  'Fernando', 'Ricardo', 'Andrés', 'Javier', 'Miguel',
];

const LAST_NAMES = [
  'García', 'Rodríguez', 'Martínez', 'López', 'González',
  'Hernández', 'Pérez', 'Sánchez', 'Ramírez', 'Torres',
  'Flores', 'Rivera', 'Gómez', 'Díaz', 'Cruz',
  'Morales', 'Reyes', 'Gutiérrez', 'Ortiz', 'Ramos',
];

const TEACHER_SPECIALTIES = [
  'Matemáticas y Estadística', 'Lengua y Comunicación', 'Ciencias Sociales',
  'Física y Astronomía', 'Química Orgánica', 'Biología Molecular',
  'Geografía e Historia', 'Artes Visuales', 'Idiomas Extranjeros',
  'Ingeniería de Software', 'Filosofía y Ética', 'Economía y Finanzas',
];

const TASK_TITLES = [
  'Ensayo argumentativo sobre', 'Resolución de problemas de', 'Proyecto de investigación:',
  'Examen parcial de', 'Trabajo práctico:', 'Presentación oral sobre',
  'Análisis crítico de', 'Laboratorio práctico:', 'Quiz rápido de',
  'Informe de lectura:', 'Mapa conceptual de', 'Debate grupal sobre',
  'Ejercicios de repaso:', 'Estudio de caso:', 'Portfolio digital de',
];

const TASK_TOPICS = [
  'la revolución industrial', 'ecuaciones diferenciales', 'el cambio climático',
  'la literatura contemporánea', 'reacciones químicas', 'el sistema solar',
  'la economía global', 'el arte renacentista', 'la programación orientada a objetos',
  'los derechos humanos', 'la genética molecular', 'la filosofía moderna',
  'la estadística descriptiva', 'la geografía política', 'la música clásica',
];

const BOOK_CATEGORIES_DATA = [
  'Ciencias Exactas', 'Literatura', 'Historia y Geografía', 'Tecnología',
  'Arte y Cultura', 'Ciencias Naturales', 'Filosofía y Ética', 'Idiomas',
  'Economía y Negocios', 'Referencia General',
];

const BOOK_TITLES = [
  'Cálculo Diferencial e Integral', 'Álgebra Lineal Aplicada', 'Física Universitaria Vol. I',
  'Física Universitaria Vol. II', 'Química General', 'Biología Celular y Molecular',
  'Historia Universal Contemporánea', 'Geografía Económica Mundial', 'Introducción a la Filosofía',
  'Principios de Economía', 'Fundamentos de Programación', 'Estructuras de Datos en C++',
  'Don Quijote de la Mancha', 'Cien Años de Soledad', 'El Principito',
  'La Odisea', 'Hamlet', 'Orgullo y Prejuicio',
  'Breve Historia del Tiempo', 'El Origen de las Especies', 'Cosmos',
  'Sapiens: De Animales a Dioses', 'El Arte de la Guerra', 'Meditaciones',
  'Estadística para Administración', 'Contabilidad Financiera', 'Marketing Digital',
  'Psicología General', 'Sociología Contemporánea', 'Derecho Constitucional',
  'Inglés Avanzado: Grammar in Use', 'Francés para Principiantes', 'Portugués Básico',
  'Atlas Geográfico Mundial', 'Diccionario de la RAE', 'Enciclopedia de Ciencias',
  'Mecánica de Fluidos', 'Termodinámica Aplicada', 'Electromagnetismo',
  'Anatomía Humana', 'Microbiología Médica', 'Farmacología Básica',
  'Historia del Arte', 'Teoría Musical', 'Fotografía Digital',
  'Inteligencia Artificial: Un Enfoque Moderno', 'Redes de Computadoras',
  'Sistemas Operativos Modernos', 'Base de Datos: Diseño e Implementación',
  'Cálculo Numérico', 'Ecuaciones Diferenciales',
];

const BOOK_AUTHORS = [
  'James Stewart', 'David C. Lay', 'Hugh D. Young', 'Raymond A. Serway',
  'Raymond Chang', 'Bruce Alberts', 'Jürgen Osterhammel', 'Paul Krugman',
  'Bertrand Russell', 'N. Gregory Mankiw', 'Bjarne Stroustrup', 'Thomas H. Cormen',
  'Miguel de Cervantes', 'Gabriel García Márquez', 'Antoine de Saint-Exupéry',
  'Homero', 'William Shakespeare', 'Jane Austen',
  'Stephen Hawking', 'Charles Darwin', 'Carl Sagan',
  'Yuval Noah Harari', 'Sun Tzu', 'Marco Aurelio',
  'Douglas A. Lind', 'Charles T. Horngren', 'Philip Kotler',
  'Robert Feldman', 'Anthony Giddens', 'Hans Kelsen',
  'Raymond Murphy', 'Assimil', 'Berlitz',
  'National Geographic', 'RAE', 'Britannica',
  'Frank M. White', 'Yunus A. Çengel', 'David J. Griffiths',
  'Keith L. Moore', 'Patrick R. Murray', 'Bertram G. Katzung',
  'Ernst Gombrich', 'Walter Piston', 'Scott Kelby',
  'Stuart Russell', 'Andrew S. Tanenbaum', 'Abraham Silberschatz',
  'Ramez Elmasri', 'Richard L. Burden', 'Dennis G. Zill',
];

const TICKET_CATEGORIES = [
  'Bug', 'Consulta', 'Acceso', 'Rendimiento', 'Funcionalidad',
  'Datos', 'Interfaz', 'Seguridad',
];

const TICKET_TITLES = [
  'No puedo ver mis calificaciones', 'Error al subir archivo de tarea',
  'La app se cierra al abrir el chat', 'No recibo notificaciones',
  'Mi contraseña no funciona', 'No puedo acceder a mi aula virtual',
  'Error 500 al enviar tarea', 'Las fechas del calendario están mal',
  'No puedo descargar los recursos', 'El perfil no muestra mi foto',
  'Problema con el escáner QR', 'No aparecen mis compañeros de clase',
  'Error al cambiar de institución', 'La búsqueda de libros no funciona',
  'No puedo prestar un libro', 'El chat grupal no carga mensajes',
  'Problema con la sesión (se cierra sola)', 'No puedo editar mi perfil',
  'Error al registrar nuevo estudiante', 'Las estadísticas no se actualizan',
];


// ─── Main Seed Function ─────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Starting comprehensive data seed...\n');

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. CLEAN DATABASE (respecting FK order)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('🗑️  Cleaning existing data...');
  await prisma.messageDeletion.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.message.deleteMany();
  await prisma.review.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.collaborator.deleteMany();
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

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. INSTITUTIONS (3)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('🏫 Creating institutions...');

  const inst1 = await prisma.institution.create({
    data: {
      name: 'Instituto Tecnológico Central',
      address: 'Av. Educación 123, Ciudad Capital',
      logoUrl: 'https://ui-avatars.com/api/?name=ITC&background=007AFF&color=fff&size=200',
    },
  });

  const inst2 = await prisma.institution.create({
    data: {
      name: 'Colegio Americano del Este',
      address: 'Calle 50 #12-45, Sector Norte',
      logoUrl: 'https://ui-avatars.com/api/?name=CAE&background=34C759&color=fff&size=200',
    },
  });

  const inst3 = await prisma.institution.create({
    data: {
      name: 'Escuela Superior de Artes y Ciencias',
      address: 'Boulevard Universitario 789, Zona Sur',
      logoUrl: 'https://ui-avatars.com/api/?name=ESAC&background=FF9500&color=fff&size=200',
    },
  });

  console.log(`   ✅ 3 institutions created`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. CORE USERS (one per role, manually created for known credentials)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('👤 Creating core users (1 per role)...');

  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@homework.com',
      password: hashedPassword,
      fullName: 'Administrador Global',
      role: Role.SUPER_ADMIN,
      isVerified: true,
      bio: 'Administrador principal de la plataforma Homework.',
      avatarUrl: 'https://ui-avatars.com/api/?name=Admin+Global&background=000&color=fff',
    },
  });

  const schoolAdmin1 = await prisma.user.create({
    data: {
      email: 'admin@itc.edu',
      password: hashedPassword,
      fullName: 'Lic. Ricardo Pérez',
      role: Role.SCHOOL_ADMIN,
      institutionId: inst1.id,
      isVerified: true,
      bio: 'Director académico del Instituto Tecnológico Central.',
      avatarUrl: 'https://ui-avatars.com/api/?name=Ricardo+Perez&background=5856D6&color=fff',
    },
  });

  const schoolAdmin2 = await prisma.user.create({
    data: {
      email: 'admin@cae.edu',
      password: hashedPassword,
      fullName: 'Dra. Ana María Vega',
      role: Role.SCHOOL_ADMIN,
      institutionId: inst2.id,
      isVerified: true,
      bio: 'Rectora del Colegio Americano del Este.',
      avatarUrl: 'https://ui-avatars.com/api/?name=Ana+Vega&background=AF52DE&color=fff',
    },
  });

  const coreTeacher = await prisma.user.create({
    data: {
      email: 'profe.marta@itc.edu',
      password: hashedPassword,
      fullName: 'Dra. Marta Gómez',
      role: Role.TEACHER,
      institutionId: inst1.id,
      isVerified: true,
      specialty: 'Matemáticas y Física',
      bio: 'Docente con 15 años de experiencia en educación superior. Investigadora en didáctica de las ciencias exactas.',
      avatarUrl: 'https://i.pravatar.cc/150?u=marta',
    },
  });

  const coreStudent = await prisma.user.create({
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
      bio: 'Estudiante de 4to año, apasionado por la tecnología.',
      avatarUrl: 'https://i.pravatar.cc/150?u=carlos',
    },
  });

  const coreSupport = await prisma.user.create({
    data: {
      email: 'soporte@itc.edu',
      password: hashedPassword,
      fullName: 'Tec. Mario Casas',
      role: Role.SUPPORT,
      institutionId: inst1.id,
      isVerified: true,
      bio: 'Técnico de soporte nivel 2. Especialista en resolución de incidencias.',
      avatarUrl: 'https://i.pravatar.cc/150?u=mario',
    },
  });

  const support2 = await prisma.user.create({
    data: {
      email: 'soporte2@itc.edu',
      password: hashedPassword,
      fullName: 'Ing. Laura Mendoza',
      role: Role.SUPPORT,
      institutionId: inst1.id,
      isVerified: true,
      bio: 'Ingeniera de soporte técnico. Especialista en infraestructura.',
      avatarUrl: 'https://i.pravatar.cc/150?u=laura',
    },
  });

  console.log(`   ✅ 7 core users created`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. CLASSROOMS (15 across 2 institutions)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('🏛️  Creating classrooms...');

  const classroomNames = [
    { name: '1er Año - Sección A', desc: 'Primer año de formación básica, turno mañana' },
    { name: '1er Año - Sección B', desc: 'Primer año de formación básica, turno tarde' },
    { name: '2do Año - Sección A', desc: 'Segundo año, orientación ciencias' },
    { name: '2do Año - Sección B', desc: 'Segundo año, orientación humanidades' },
    { name: '3er Año - Sección A', desc: 'Tercer año, orientación tecnología' },
    { name: '3er Año - Sección B', desc: 'Tercer año, orientación artes' },
    { name: '4to Año - Sección A', desc: 'Cuarto año, especialización ciencias exactas' },
    { name: '4to Año - Sección B', desc: 'Cuarto año, especialización ciencias sociales' },
    { name: '5to Año - Sección A', desc: 'Quinto año, preparación universitaria' },
    { name: '5to Año - Sección B', desc: 'Quinto año, formación técnica' },
  ];

  const classrooms: any[] = [];
  // 10 classrooms for inst1
  for (const c of classroomNames) {
    const cls = await prisma.classroom.create({
      data: { name: c.name, description: c.desc, institutionId: inst1.id },
    });
    classrooms.push(cls);
  }
  // 5 classrooms for inst2
  for (let i = 0; i < 5; i++) {
    const cls = await prisma.classroom.create({
      data: {
        name: `Grado ${i + 1} - Grupo ${String.fromCharCode(65 + i)}`,
        description: `Aula del Colegio Americano, nivel ${i + 1}`,
        institutionId: inst2.id,
      },
    });
    classrooms.push(cls);
  }

  // Assign core student to a classroom
  await prisma.user.update({
    where: { id: coreStudent.id },
    data: { classroomId: classrooms[6].id }, // 4to Año - Sección A
  });

  console.log(`   ✅ ${classrooms.length} classrooms created`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. BULK TEACHERS (30 for inst1, 10 for inst2)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('👩‍🏫 Creating teachers...');

  const teacherBulkData: any[] = [];
  for (let i = 1; i <= 30; i++) {
    const fn = FIRST_NAMES[i % FIRST_NAMES.length];
    const ln = LAST_NAMES[i % LAST_NAMES.length];
    teacherBulkData.push({
      email: `profe${i}@itc.edu`,
      password: hashedPassword,
      fullName: `Prof. ${fn} ${ln}`,
      role: Role.TEACHER,
      institutionId: inst1.id,
      isVerified: true,
      specialty: TEACHER_SPECIALTIES[i % TEACHER_SPECIALTIES.length],
      bio: `Docente especializado en ${TEACHER_SPECIALTIES[i % TEACHER_SPECIALTIES.length].toLowerCase()}.`,
      avatarUrl: `https://i.pravatar.cc/150?u=teacher${i}`,
    });
  }
  for (let i = 1; i <= 10; i++) {
    const fn = FIRST_NAMES[(i + 15) % FIRST_NAMES.length];
    const ln = LAST_NAMES[(i + 10) % LAST_NAMES.length];
    teacherBulkData.push({
      email: `profe${i}@cae.edu`,
      password: hashedPassword,
      fullName: `Prof. ${fn} ${ln}`,
      role: Role.TEACHER,
      institutionId: inst2.id,
      isVerified: true,
      specialty: TEACHER_SPECIALTIES[i % TEACHER_SPECIALTIES.length],
      avatarUrl: `https://i.pravatar.cc/150?u=cae-teacher${i}`,
    });
  }
  await prisma.user.createMany({ data: teacherBulkData });

  const allTeachers = await prisma.user.findMany({
    where: { role: Role.TEACHER },
    orderBy: { email: 'asc' },
  });
  const inst1Teachers = allTeachers.filter((t) => t.institutionId === inst1.id);
  const inst2Teachers = allTeachers.filter((t) => t.institutionId === inst2.id);

  console.log(`   ✅ ${allTeachers.length} teachers created`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. BULK STUDENTS (200 for inst1, 80 for inst2)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('🎓 Creating students...');

  const studentBulkData: any[] = [];
  const inst1Classrooms = classrooms.filter((c) => c.institutionId === inst1.id);
  const inst2Classrooms = classrooms.filter((c) => c.institutionId === inst2.id);

  for (let i = 1; i <= 200; i++) {
    const fn = FIRST_NAMES[i % FIRST_NAMES.length];
    const ln1 = LAST_NAMES[i % LAST_NAMES.length];
    const ln2 = LAST_NAMES[(i + 7) % LAST_NAMES.length];
    studentBulkData.push({
      email: `estudiante${i}@itc.edu`,
      password: hashedPassword,
      fullName: `${fn} ${ln1} ${ln2}`,
      role: Role.STUDENT,
      institutionId: inst1.id,
      classroomId: inst1Classrooms[i % inst1Classrooms.length].id,
      isVerified: i % 20 !== 0, // 10 unverified students
      identityCode: `HW-ST-${String(1000 + i).padStart(5, '0')}`,
      parentName: `${FIRST_NAMES[(i + 3) % FIRST_NAMES.length]} ${ln1}`,
      parentPhone: `+549${String(1100000000 + i)}`,
    });
  }
  for (let i = 1; i <= 80; i++) {
    const fn = FIRST_NAMES[(i + 5) % FIRST_NAMES.length];
    const ln1 = LAST_NAMES[(i + 3) % LAST_NAMES.length];
    studentBulkData.push({
      email: `alumno${i}@cae.edu`,
      password: hashedPassword,
      fullName: `${fn} ${ln1}`,
      role: Role.STUDENT,
      institutionId: inst2.id,
      classroomId: inst2Classrooms[i % inst2Classrooms.length].id,
      isVerified: true,
      identityCode: `CAE-ST-${String(2000 + i).padStart(5, '0')}`,
    });
  }
  await prisma.user.createMany({ data: studentBulkData });

  const allStudents = await prisma.user.findMany({
    where: { role: Role.STUDENT },
    orderBy: { email: 'asc' },
  });
  const inst1Students = allStudents.filter((s) => s.institutionId === inst1.id);
  const inst2Students = allStudents.filter((s) => s.institutionId === inst2.id);

  console.log(`   ✅ ${allStudents.length} students created`);


  // ═══════════════════════════════════════════════════════════════════════════
  // 7. SUBJECTS / PROJECTS (30 for inst1, 10 for inst2)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('📚 Creating subjects (projects)...');

  const subjects: any[] = [];
  // 30 subjects for inst1 — each teacher gets 1 subject, spread across classrooms
  for (let i = 0; i < 30; i++) {
    const sub = await prisma.project.create({
      data: {
        name: `${SUBJECT_NAMES[i % SUBJECT_NAMES.length]}${i >= 20 ? ' Avanzada' : ''}`,
        description: `Materia curricular ${i < 20 ? 'obligatoria' : 'electiva'} — nivel ${Math.floor(i / 10) + 1}. Programa académico completo con evaluaciones continuas.`,
        color: COLORS[i % COLORS.length],
        icon: 'book',
        institutionId: inst1.id,
        classroomId: inst1Classrooms[i % inst1Classrooms.length].id,
        userId: inst1Teachers[i % inst1Teachers.length].id,
      },
    });
    subjects.push(sub);
  }
  // 10 subjects for inst2
  for (let i = 0; i < 10; i++) {
    const sub = await prisma.project.create({
      data: {
        name: `${SUBJECT_NAMES[i % SUBJECT_NAMES.length]}`,
        description: `Asignatura del Colegio Americano — programa internacional.`,
        color: COLORS[(i + 5) % COLORS.length],
        icon: 'book',
        institutionId: inst2.id,
        classroomId: inst2Classrooms[i % inst2Classrooms.length].id,
        userId: inst2Teachers[i % inst2Teachers.length].id,
      },
    });
    subjects.push(sub);
  }

  const inst1Subjects = subjects.slice(0, 30);
  const inst2Subjects = subjects.slice(30);

  console.log(`   ✅ ${subjects.length} subjects created`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. PROJECT MEMBERS (enroll students into subjects)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('👥 Enrolling students into subjects...');

  const memberData: any[] = [];
  // Each inst1 student enrolls in 5 subjects based on their classroom
  for (const student of inst1Students) {
    const classroomIdx = inst1Classrooms.findIndex((c) => c.id === student.classroomId);
    if (classroomIdx === -1) continue;
    // Pick 5 subjects that belong to the same classroom or adjacent
    for (let j = 0; j < 5; j++) {
      const subIdx = (classroomIdx * 3 + j) % inst1Subjects.length;
      memberData.push({
        projectId: inst1Subjects[subIdx].id,
        userId: student.id,
        role: 'student',
      });
    }
  }
  // Each inst2 student enrolls in 4 subjects
  for (const student of inst2Students) {
    for (let j = 0; j < 4; j++) {
      const subIdx = j % inst2Subjects.length;
      memberData.push({
        projectId: inst2Subjects[subIdx].id,
        userId: student.id,
        role: 'student',
      });
    }
  }
  // Also enroll teachers as "teacher" members
  for (let i = 0; i < inst1Subjects.length; i++) {
    memberData.push({
      projectId: inst1Subjects[i].id,
      userId: inst1Teachers[i % inst1Teachers.length].id,
      role: 'teacher',
    });
  }

  // Deduplicate by projectId+userId
  const memberSet = new Set<string>();
  const uniqueMembers = memberData.filter((m) => {
    const key = `${m.projectId}:${m.userId}`;
    if (memberSet.has(key)) return false;
    memberSet.add(key);
    return true;
  });

  await prisma.projectMember.createMany({ data: uniqueMembers, skipDuplicates: true });
  console.log(`   ✅ ${uniqueMembers.length} project memberships created`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. UNITS (3-5 per subject)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('📖 Creating units...');

  const unitNames = [
    'Introducción y Fundamentos', 'Conceptos Intermedios', 'Aplicaciones Prácticas',
    'Análisis Avanzado', 'Proyecto Final e Integración',
  ];

  const units: any[] = [];
  for (const sub of subjects) {
    const unitCount = randomInt(3, 5);
    for (let u = 0; u < unitCount; u++) {
      const unit = await prisma.unit.create({
        data: {
          name: `Unidad ${u + 1}: ${unitNames[u]}`,
          description: `Módulo ${u + 1} del programa de ${sub.name}. Incluye contenido teórico y práctico.`,
          order: u + 1,
          projectId: sub.id,
        },
      });
      units.push(unit);
    }
  }

  console.log(`   ✅ ${units.length} units created`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. TASKS (5-8 per subject, assigned to units)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('📝 Creating tasks...');

  const taskTypes: TaskType[] = [TaskType.ASSIGNMENT, TaskType.EXAM, TaskType.QUIZ, TaskType.NOTE];
  const taskStatuses: TaskStatus[] = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE];

  const tasks: any[] = [];
  for (const sub of subjects) {
    const subUnits = units.filter((u) => u.projectId === sub.id);
    const taskCount = randomInt(5, 8);

    for (let t = 0; t < taskCount; t++) {
      const topic = TASK_TOPICS[t % TASK_TOPICS.length];
      const titlePrefix = TASK_TITLES[t % TASK_TITLES.length];
      const assignedUnit = subUnits.length > 0 ? subUnits[t % subUnits.length] : null;

      // Mix of past, current, and future due dates
      let dueDate: Date;
      if (t < 2) {
        dueDate = daysAgo(randomInt(5, 30)); // past
      } else if (t < 4) {
        dueDate = daysFromNow(randomInt(1, 7)); // this week
      } else {
        dueDate = daysFromNow(randomInt(8, 60)); // future
      }

      const task = await prisma.task.create({
        data: {
          title: `${titlePrefix} ${topic}`,
          description: `Actividad evaluativa sobre ${topic}. Fecha límite estricta. Consultar rúbrica adjunta para criterios de evaluación.`,
          status: t < 2 ? TaskStatus.DONE : taskStatuses[t % taskStatuses.length],
          type: taskTypes[t % taskTypes.length],
          maxGrade: t % 5 === 0 ? 50 : 100,
          projectId: sub.id,
          unitId: assignedUnit?.id ?? null,
          dueDate,
        },
      });
      tasks.push(task);
    }
  }

  console.log(`   ✅ ${tasks.length} tasks created`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 11. SUBMISSIONS (3-5 per task for completed tasks, ~600 total)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('📤 Creating submissions...');

  const submissionData: any[] = [];
  const submissionKeys = new Set<string>();

  for (const task of tasks) {
    // Only create submissions for DONE or IN_PROGRESS tasks
    if (task.status === TaskStatus.TODO) continue;

    const subCount = task.status === TaskStatus.DONE ? randomInt(3, 5) : randomInt(1, 3);
    const subjectStudents = task.projectId
      ? inst1Students.filter((_, idx) => idx % 3 === 0).slice(0, 20) // sample
      : [];

    for (let s = 0; s < Math.min(subCount, subjectStudents.length); s++) {
      const student = subjectStudents[s];
      const key = `${task.id}:${student.id}`;
      if (submissionKeys.has(key)) continue;
      submissionKeys.add(key);

      const isGraded = task.status === TaskStatus.DONE && s < subCount - 1;
      const grade = isGraded ? randomInt(45, 100) : undefined;

      submissionData.push({
        taskId: task.id,
        studentId: student.id,
        content: `Respuesta del estudiante ${student.fullName} a la actividad "${task.title}". Desarrollo completo del tema solicitado con referencias bibliográficas.`,
        fileUrl: s % 3 === 0 ? `/uploads/submission-${task.id.slice(0, 8)}-${s}.pdf` : null,
        grade: grade ?? null,
        feedback: isGraded
          ? randomItem([
              'Buen trabajo, se nota el esfuerzo. Revisar la conclusión.',
              'Excelente análisis. Muy bien documentado.',
              'Correcto pero falta profundidad en el desarrollo.',
              'Trabajo aceptable. Mejorar la presentación.',
              'Sobresaliente. Uno de los mejores trabajos del grupo.',
            ])
          : null,
        status: isGraded ? SubmissionStatus.GRADED : SubmissionStatus.SUBMITTED,
        createdAt: daysAgo(randomInt(1, 20)),
      });
    }
  }

  // Batch insert in chunks to avoid memory issues
  const CHUNK_SIZE = 200;
  for (let i = 0; i < submissionData.length; i += CHUNK_SIZE) {
    await prisma.submission.createMany({
      data: submissionData.slice(i, i + CHUNK_SIZE),
      skipDuplicates: true,
    });
  }

  console.log(`   ✅ ${submissionData.length} submissions created`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 12. SCHEDULES (weekly timetable for inst1 subjects)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('📅 Creating schedules...');

  const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
  const timeSlots = [
    { start: '07:00', end: '08:30' },
    { start: '08:45', end: '10:15' },
    { start: '10:30', end: '12:00' },
    { start: '13:00', end: '14:30' },
    { start: '14:45', end: '16:15' },
    { start: '16:30', end: '18:00' },
  ];
  const rooms = ['Aula 101', 'Aula 102', 'Aula 201', 'Aula 202', 'Lab. Física', 'Lab. Química', 'Lab. Informática', 'Sala de Arte', 'Auditorio'];

  const scheduleData: any[] = [];
  for (let i = 0; i < inst1Subjects.length; i++) {
    const sub = inst1Subjects[i];
    // Each subject gets 2-3 schedule slots per week
    const slotCount = randomInt(2, 3);
    const usedDays = new Set<string>();

    for (let s = 0; s < slotCount; s++) {
      let day: string;
      do {
        day = days[randomInt(0, days.length - 1)];
      } while (usedDays.has(day));
      usedDays.add(day);

      const slot = timeSlots[(i + s) % timeSlots.length];
      scheduleData.push({
        day,
        startTime: slot.start,
        endTime: slot.end,
        room: rooms[(i + s) % rooms.length],
        projectId: sub.id,
        institutionId: inst1.id,
      });
    }
  }

  await prisma.schedule.createMany({ data: scheduleData });
  console.log(`   ✅ ${scheduleData.length} schedule entries created`);


  // ═══════════════════════════════════════════════════════════════════════════
  // 13. LIBRARY — BOOK CATEGORIES & BOOKS (10 categories, 120 books)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('📕 Creating library catalog...');

  const bookCategories: any[] = [];
  for (const catName of BOOK_CATEGORIES_DATA) {
    const cat = await prisma.bookCategory.create({ data: { name: catName } });
    bookCategories.push(cat);
  }

  const bookData: any[] = [];
  for (let i = 0; i < BOOK_TITLES.length; i++) {
    const catIdx = i % bookCategories.length;
    bookData.push({
      title: BOOK_TITLES[i],
      author: BOOK_AUTHORS[i % BOOK_AUTHORS.length],
      synopsis: `Obra de referencia en el área de ${bookCategories[catIdx].name.toLowerCase()}. Edición actualizada con ejercicios prácticos y material complementario digital.`,
      location: `Estante ${String.fromCharCode(65 + (i % 8))}-${Math.floor(i / 8) + 1}`,
      coverUrl: `https://picsum.photos/seed/book${i}/200/300`,
      available: i % 8 !== 0, // ~12% unavailable
      categoryId: bookCategories[catIdx].id,
      institutionId: i < 40 ? inst1.id : inst2.id,
    });
  }
  // Add extra books to reach 120
  for (let i = BOOK_TITLES.length; i < 120; i++) {
    bookData.push({
      title: `Manual de Estudio Vol. ${i - BOOK_TITLES.length + 1}`,
      author: `Editorial Académica`,
      synopsis: 'Material de apoyo para el programa curricular.',
      location: `Estante Z-${i - BOOK_TITLES.length + 1}`,
      available: true,
      categoryId: bookCategories[i % bookCategories.length].id,
      institutionId: inst1.id,
    });
  }

  await prisma.book.createMany({ data: bookData });
  const allBooks = await prisma.book.findMany({ orderBy: { title: 'asc' } });

  console.log(`   ✅ ${bookCategories.length} categories, ${allBooks.length} books created`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 14. BOOK LOANS (50 active, 30 returned, 10 overdue)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('📖 Creating book loans...');

  const loanData: any[] = [];
  const availableBooks = allBooks.filter((b) => b.available);

  // Active loans
  for (let i = 0; i < 50 && i < availableBooks.length; i++) {
    const student = inst1Students[i % inst1Students.length];
    loanData.push({
      bookId: availableBooks[i].id,
      userId: student.id,
      loanDate: daysAgo(randomInt(1, 14)),
      status: LoanStatus.ACTIVE,
    });
  }

  // Returned loans
  for (let i = 0; i < 30; i++) {
    const bookIdx = (50 + i) % allBooks.length;
    const student = inst1Students[(i + 50) % inst1Students.length];
    loanData.push({
      bookId: allBooks[bookIdx].id,
      userId: student.id,
      loanDate: daysAgo(randomInt(30, 60)),
      returnDate: daysAgo(randomInt(1, 29)),
      status: LoanStatus.RETURNED,
    });
  }

  // Overdue loans
  for (let i = 0; i < 10; i++) {
    const bookIdx = (80 + i) % allBooks.length;
    const student = inst1Students[(i + 80) % inst1Students.length];
    loanData.push({
      bookId: allBooks[bookIdx].id,
      userId: student.id,
      loanDate: daysAgo(randomInt(30, 45)),
      status: LoanStatus.OVERDUE,
    });
  }

  await prisma.bookLoan.createMany({ data: loanData });
  console.log(`   ✅ ${loanData.length} book loans created (50 active, 30 returned, 10 overdue)`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 15. SUPPORT TICKETS (100 tickets with varied statuses)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('🎫 Creating support tickets...');

  const ticketStatuses: TicketStatus[] = [TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED, TicketStatus.CLOSED];
  const supportStaff = [coreSupport, support2];

  const ticketData: any[] = [];
  for (let i = 0; i < 100; i++) {
    const creator = i < 70
      ? inst1Students[i % inst1Students.length]
      : inst1Teachers[i % inst1Teachers.length];
    const status = ticketStatuses[i % ticketStatuses.length];

    ticketData.push({
      title: TICKET_TITLES[i % TICKET_TITLES.length],
      description: `Descripción detallada del problema: ${TICKET_TITLES[i % TICKET_TITLES.length].toLowerCase()}. El problema ocurre de forma intermitente desde hace ${randomInt(1, 7)} días. Adjunto capturas de pantalla.`,
      category: TICKET_CATEGORIES[i % TICKET_CATEGORIES.length],
      status,
      createdById: creator.id,
      assignedToId: status !== TicketStatus.OPEN ? supportStaff[i % supportStaff.length].id : null,
      createdAt: daysAgo(randomInt(0, 30)),
    });
  }

  await prisma.ticket.createMany({ data: ticketData });
  const allTickets = await prisma.ticket.findMany({ orderBy: { createdAt: 'desc' } });

  console.log(`   ✅ ${allTickets.length} support tickets created`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 16. REVIEWS (for resolved/closed tickets)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('⭐ Creating ticket reviews...');

  const resolvedTickets = allTickets.filter(
    (t) => t.status === TicketStatus.RESOLVED || t.status === TicketStatus.CLOSED
  );

  const reviewData: any[] = [];
  for (let i = 0; i < Math.min(resolvedTickets.length, 40); i++) {
    const ticket = resolvedTickets[i];
    reviewData.push({
      rating: randomInt(2, 5),
      comment: randomItem([
        'Excelente atención, resolvieron mi problema rápidamente.',
        'Buena respuesta pero tardaron un poco.',
        'Resuelto satisfactoriamente. Gracias por la ayuda.',
        'Podría mejorar el tiempo de respuesta.',
        'Muy profesional y amable el soporte técnico.',
        'Se resolvió parcialmente, tuve que insistir.',
        'Perfecto, todo funcionando correctamente ahora.',
        null, // some reviews without comment
      ]),
      ticketId: ticket.id,
      userId: ticket.createdById,
    });
  }

  // Create reviews one by one to handle the unique constraint on ticketId
  let reviewCount = 0;
  for (const r of reviewData) {
    try {
      await prisma.review.create({ data: r });
      reviewCount++;
    } catch {
      // Skip duplicates
    }
  }

  console.log(`   ✅ ${reviewCount} reviews created`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 17. NOTIFICATIONS (varied types, mix of read/unread)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('🔔 Creating notifications...');

  const notifTypes: NotificationType[] = [
    NotificationType.TASK,
    NotificationType.SUBMISSION_GRADED,
    NotificationType.PROJECT,
    NotificationType.ALERT,
    NotificationType.COLLABORATOR_REQUEST,
    NotificationType.COLLABORATOR_ACCEPTED,
  ];

  const notifTemplates = [
    { type: NotificationType.TASK, title: 'Nueva tarea asignada', msg: 'Se ha publicado una nueva tarea en {subject}. Fecha límite: {date}.' },
    { type: NotificationType.SUBMISSION_GRADED, title: 'Calificación disponible', msg: 'Tu entrega en {subject} ha sido calificada. Revisa tu nota.' },
    { type: NotificationType.PROJECT, title: 'Actualización del proyecto', msg: 'Hay novedades en el proyecto {subject}. Revisa los cambios.' },
    { type: NotificationType.ALERT, title: 'Aviso del sistema', msg: 'Mantenimiento programado para el {date}. La plataforma estará temporalmente fuera de servicio.' },
    { type: NotificationType.COLLABORATOR_REQUEST, title: 'Solicitud de colaboración', msg: '{user} te ha enviado una solicitud de colaboración.' },
    { type: NotificationType.COLLABORATOR_ACCEPTED, title: 'Colaboración aceptada', msg: '{user} ha aceptado tu solicitud de colaboración.' },
  ];

  const notifData: any[] = [];
  // Notifications for students
  for (let i = 0; i < 150; i++) {
    const student = inst1Students[i % inst1Students.length];
    const template = notifTemplates[i % notifTemplates.length];
    const sub = inst1Subjects[i % inst1Subjects.length];

    notifData.push({
      title: template.title,
      message: template.msg
        .replace('{subject}', sub.name)
        .replace('{date}', daysFromNow(randomInt(1, 14)).toLocaleDateString('es'))
        .replace('{user}', randomItem(inst1Teachers).fullName),
      type: template.type,
      read: i % 3 !== 0, // ~33% unread
      userId: student.id,
      createdAt: daysAgo(randomInt(0, 14)),
    });
  }
  // Notifications for teachers
  for (let i = 0; i < 50; i++) {
    const teacher = inst1Teachers[i % inst1Teachers.length];
    notifData.push({
      title: randomItem(['Nueva entrega recibida', 'Recordatorio de calificación', 'Mensaje del administrador']),
      message: `Tienes ${randomInt(1, 10)} entregas pendientes de calificación en tus materias.`,
      type: randomItem([NotificationType.TASK, NotificationType.SUBMISSION_GRADED, NotificationType.ALERT]),
      read: i % 2 === 0,
      userId: teacher.id,
      createdAt: daysAgo(randomInt(0, 7)),
    });
  }
  // Notifications for admins
  for (const admin of [superAdmin, schoolAdmin1, schoolAdmin2]) {
    for (let i = 0; i < 10; i++) {
      notifData.push({
        title: randomItem(['Nuevo usuario registrado', 'Ticket de soporte escalado', 'Reporte semanal disponible']),
        message: `Actividad administrativa pendiente de revisión. ${randomInt(1, 5)} elementos requieren atención.`,
        type: NotificationType.ALERT,
        read: i > 5,
        userId: admin.id,
        createdAt: daysAgo(randomInt(0, 10)),
      });
    }
  }

  await prisma.notification.createMany({ data: notifData });
  console.log(`   ✅ ${notifData.length} notifications created`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 18. COLLABORATORS (peer connections between students)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('🤝 Creating collaborator connections...');

  const collabData: any[] = [];
  const collabKeys = new Set<string>();

  for (let i = 0; i < 60; i++) {
    const requester = inst1Students[i % inst1Students.length];
    const addressee = inst1Students[(i + randomInt(1, 50)) % inst1Students.length];
    if (requester.id === addressee.id) continue;

    const key1 = `${requester.id}:${addressee.id}`;
    const key2 = `${addressee.id}:${requester.id}`;
    if (collabKeys.has(key1) || collabKeys.has(key2)) continue;
    collabKeys.add(key1);

    const status: CollaboratorStatus = i < 40
      ? CollaboratorStatus.ACTIVE
      : i < 50
        ? CollaboratorStatus.PENDING
        : CollaboratorStatus.REJECTED;

    collabData.push({
      requesterId: requester.id,
      addresseeId: addressee.id,
      status,
    });
  }

  await prisma.collaborator.createMany({ data: collabData, skipDuplicates: true });
  console.log(`   ✅ ${collabData.length} collaborator connections created`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 19. MESSAGES & ATTACHMENTS (DMs + group chats)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('💬 Creating messages and attachments...');

  const chatMessages: any[] = [];

  // Direct messages between students and teachers (100)
  for (let i = 0; i < 100; i++) {
    const student = inst1Students[i % inst1Students.length];
    const teacher = inst1Teachers[i % inst1Teachers.length];
    const isStudentSender = i % 2 === 0;

    chatMessages.push({
      text: randomItem([
        'Buenos días profesor, tengo una duda sobre la tarea.',
        'Claro, ¿en qué puedo ayudarte?',
        '¿Cuándo es la fecha límite de entrega?',
        'La fecha límite es el viernes a las 23:59.',
        'Gracias por la aclaración, profesor.',
        '¿Podría revisar mi borrador antes de la entrega final?',
        'Sí, envíamelo por aquí y lo reviso.',
        'Profesor, no puedo acceder al material de la clase.',
        'Voy a verificar los permisos, dame un momento.',
        'Listo, ya deberías poder acceder. Avísame si persiste el problema.',
      ]),
      senderId: isStudentSender ? student.id : teacher.id,
      receiverId: isStudentSender ? teacher.id : student.id,
      createdAt: daysAgo(randomInt(0, 14)),
    });
  }

  // Group/project messages (80)
  for (let i = 0; i < 80; i++) {
    const sub = inst1Subjects[i % inst1Subjects.length];
    const sender = i % 3 === 0
      ? inst1Teachers[i % inst1Teachers.length]
      : inst1Students[i % inst1Students.length];

    chatMessages.push({
      text: randomItem([
        'Recuerden que mañana hay entrega.',
        '¿Alguien tiene los apuntes de la clase pasada?',
        'Yo los tengo, los subo al chat.',
        'Gracias por compartir el material.',
        'Profesor, ¿el examen incluye el tema 5?',
        'Sí, incluye todos los temas vistos hasta la fecha.',
        '¿Podemos hacer grupo para el proyecto final?',
        'Claro, armen grupos de 3-4 personas.',
        'Ya subí mi parte del trabajo grupal.',
        'Excelente, voy a revisarlo esta noche.',
      ]),
      senderId: sender.id,
      projectId: sub.id,
      createdAt: daysAgo(randomInt(0, 10)),
    });
  }

  // Create messages one by one to get IDs for attachments
  const createdMessages: any[] = [];
  for (const msg of chatMessages) {
    const created = await prisma.message.create({ data: msg });
    createdMessages.push(created);
  }

  // Add attachments to ~15% of messages
  const attachmentData: any[] = [];
  const mimeTypes = [
    { mime: 'application/pdf', ext: 'pdf', name: 'documento' },
    { mime: 'image/jpeg', ext: 'jpg', name: 'foto' },
    { mime: 'image/png', ext: 'png', name: 'captura' },
    { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', ext: 'docx', name: 'trabajo' },
    { mime: 'video/mp4', ext: 'mp4', name: 'video-clase' },
  ];

  for (let i = 0; i < createdMessages.length; i++) {
    if (i % 7 !== 0) continue; // ~15% get attachments
    const msg = createdMessages[i];
    const fileType = mimeTypes[i % mimeTypes.length];

    attachmentData.push({
      messageId: msg.id,
      fileName: `${fileType.name}-${i}.${fileType.ext}`,
      fileUrl: `/uploads/chat/${fileType.name}-${i}.${fileType.ext}`,
      mimeType: fileType.mime,
      fileSize: randomInt(50000, 5000000),
    });
  }

  await prisma.attachment.createMany({ data: attachmentData });
  console.log(`   ✅ ${createdMessages.length} messages, ${attachmentData.length} attachments created`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 20. MESSAGE DELETIONS (soft-delete history for a few users)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('🗑️  Creating message deletion records...');

  const deletionData: any[] = [];
  for (let i = 0; i < 5; i++) {
    const student = inst1Students[i];
    const teacher = inst1Teachers[i];
    deletionData.push({
      userId: student.id,
      conversationId: teacher.id,
      conversationType: 'user',
    });
  }

  await prisma.messageDeletion.createMany({ data: deletionData, skipDuplicates: true });
  console.log(`   ✅ ${deletionData.length} message deletions created`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 21. NOTIFICATION PREFERENCES (for core users)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('⚙️  Setting notification preferences...');

  await prisma.user.update({
    where: { id: coreStudent.id },
    data: {
      notificationPreferences: {
        assignments: true,
        grades: true,
        messages: true,
        system: false,
        deadlines: true,
        emailNotifications: false,
      },
    },
  });

  await prisma.user.update({
    where: { id: coreTeacher.id },
    data: {
      notificationPreferences: {
        assignments: true,
        grades: true,
        messages: true,
        system: true,
        deadlines: true,
        emailNotifications: true,
      },
    },
  });

  await prisma.user.update({
    where: { id: schoolAdmin1.id },
    data: {
      notificationPreferences: {
        assignments: false,
        grades: false,
        messages: true,
        system: true,
        deadlines: false,
        emailNotifications: true,
      },
    },
  });

  console.log(`   ✅ Notification preferences set for core users`);

  // ═══════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════
  const counts = {
    institutions: 3,
    classrooms: classrooms.length,
    users: 7 + teacherBulkData.length + studentBulkData.length,
    subjects: subjects.length,
    projectMembers: uniqueMembers.length,
    units: units.length,
    tasks: tasks.length,
    submissions: submissionData.length,
    schedules: scheduleData.length,
    bookCategories: bookCategories.length,
    books: allBooks.length,
    bookLoans: loanData.length,
    tickets: allTickets.length,
    reviews: reviewCount,
    notifications: notifData.length,
    collaborators: collabData.length,
    messages: createdMessages.length,
    attachments: attachmentData.length,
    messageDeletions: deletionData.length,
  };

  const totalRecords = Object.values(counts).reduce((a, b) => a + b, 0);

  console.log('\n' + '═'.repeat(60));
  console.log('✨ SEED COMPLETE — Summary');
  console.log('═'.repeat(60));
  console.log(`   🏫 Institutions:      ${counts.institutions}`);
  console.log(`   🏛️  Classrooms:        ${counts.classrooms}`);
  console.log(`   👤 Users:             ${counts.users}`);
  console.log(`   📚 Subjects:          ${counts.subjects}`);
  console.log(`   👥 Project Members:   ${counts.projectMembers}`);
  console.log(`   📖 Units:             ${counts.units}`);
  console.log(`   📝 Tasks:             ${counts.tasks}`);
  console.log(`   📤 Submissions:       ${counts.submissions}`);
  console.log(`   📅 Schedules:         ${counts.schedules}`);
  console.log(`   📕 Book Categories:   ${counts.bookCategories}`);
  console.log(`   📕 Books:             ${counts.books}`);
  console.log(`   📖 Book Loans:        ${counts.bookLoans}`);
  console.log(`   🎫 Tickets:           ${counts.tickets}`);
  console.log(`   ⭐ Reviews:           ${counts.reviews}`);
  console.log(`   🔔 Notifications:     ${counts.notifications}`);
  console.log(`   🤝 Collaborators:     ${counts.collaborators}`);
  console.log(`   💬 Messages:          ${counts.messages}`);
  console.log(`   📎 Attachments:       ${counts.attachments}`);
  console.log(`   🗑️  Msg Deletions:     ${counts.messageDeletions}`);
  console.log('─'.repeat(60));
  console.log(`   📊 TOTAL RECORDS:     ~${totalRecords}`);
  console.log('═'.repeat(60));

  console.log('\n🔑 Login credentials (all passwords: password123):');
  console.log('   SUPER_ADMIN:  admin@homework.com');
  console.log('   SCHOOL_ADMIN: admin@itc.edu (ITC) / admin@cae.edu (CAE)');
  console.log('   TEACHER:      profe.marta@itc.edu');
  console.log('   STUDENT:      estudiante@itc.edu');
  console.log('   SUPPORT:      soporte@itc.edu');
  console.log('');
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

import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationPreferencesDto } from './dto/notification-preferences.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async findAll(options: { 
    page?: number; 
    limit?: number; 
    role?: string; 
    institutionId?: string; 
    search?: string; 
  } = {}) {
    const { page = 1, limit = 20, role, institutionId, search } = options;

    const where: Prisma.UserWhereInput = {};

    if (role) {
      where.role = role as any;
    }

    if (institutionId) {
      where.institutionId = institutionId;
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async getUserStats(userId: string) {
    const [ownedProjects, memberProjects, submissions] = await Promise.all([
      this.prisma.project.count({ where: { userId } }),
      this.prisma.project.count({ where: { members: { some: { userId } } } }),
      this.prisma.submission.aggregate({
        where: { studentId: userId, status: 'GRADED' },
        _avg: { grade: true },
        _count: { id: true },
      }),
    ]);
    return { 
      projects: ownedProjects + memberProjects, 
      avgGrade: submissions._avg.grade || 0,
      completedTasks: submissions._count.id || 0,
    };
  }

  async getStudentProfile(studentId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: studentId },
      include: {
        classroom: {
          include: {
            projects: {
              include: { user: { select: { fullName: true } } }
            }
          }
        },
        submissions: true
      }
    });

    if (!user) return null;

    const stats = await this.getUserStats(studentId);
    const pendingTasks = await this.prisma.task.count({
      where: {
        project: { members: { some: { userId: studentId } } },
        submissions: { none: { studentId } }
      }
    });

    const attStats = await this.prisma.attendance.groupBy({
      by: ['status'],
      where: { studentId },
      _count: { id: true }
    });
    const attTotal = attStats.reduce((acc, curr) => acc + curr._count.id, 0);
    const attPresent = attStats.find(s => s.status === 'PRESENT')?._count.id || 0;
    const attPercentage = attTotal > 0 ? (attPresent / attTotal) * 100 : 100;

    return {
      ...user,
      stats: {
        ...stats,
        pendingTasks,
        attendance: `${attPercentage.toFixed(0)}%`
      },
      subjects: await Promise.all((user.classroom?.projects || []).map(async (p) => {
        const gradeData = await this.prisma.submission.aggregate({
          where: {
            studentId,
            task: { projectId: p.id },
            status: 'GRADED',
          },
          _avg: { grade: true },
        });

        const grade = gradeData._avg.grade;
        let letter = 'N/A';

        if (grade !== null) {
          if (grade >= 9.5) letter = 'A+';
          else if (grade >= 9) letter = 'A';
          else if (grade >= 8.5) letter = 'B+';
          else if (grade >= 8) letter = 'B';
          else if (grade >= 7.5) letter = 'C+';
          else if (grade >= 7) letter = 'C';
          else if (grade >= 6) letter = 'D';
          else letter = 'F';
        }

        return {
          id: p.id,
          name: p.name,
          teacher: p.user.fullName,
          grade: grade ? parseFloat(grade.toFixed(1)) : null,
          letter,
        };
      })),
    };
  }

  async getTeacherProfile(teacherId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: teacherId },
      include: {
        projects: {
          include: {
            classroom: true,
            _count: { select: { members: true } }
          }
        },
        projectMemberships: {
          where: { role: 'teacher' },
          include: {
            project: {
              include: {
                classroom: true,
                _count: { select: { members: true } }
              }
            }
          }
        }
      }
    });

    if (!user) return null;

    const allProjects = [...user.projects, ...user.projectMemberships.map(m => m.project)];
    const totalStudents = allProjects.reduce((acc, p) => acc + p._count.members, 0);

    const submissions = await this.prisma.submission.aggregate({
      where: { task: { projectId: { in: allProjects.map(p => p.id) } }, status: 'GRADED' },
      _avg: { grade: true }
    });

    return {
      ...user,
      stats: {
        totalStudents,
        totalSubjects: allProjects.length,
        avgPerformance: submissions._avg.grade || 0,
        attendance: "98%" // Placeholder
      },
      subjects: allProjects.map(p => ({
        id: p.id,
        name: p.name,
        classroom: p.classroom?.name || 'N/A',
        students: p._count.members
      }))
    };
  }

  /**
   * Get DISTINCT students for a teacher with pagination and optional classroom filtering.
   * A teacher's students come from classrooms where the teacher owns or is a member of a subject (Project).
   */
  async getTeacherStudents(
    teacherId: string,
    options: { page?: number; limit?: number; classroomId?: string } = {},
  ) {
    const { page = 1, limit = 20, classroomId } = options;

    const teacher = await this.prisma.user.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new NotFoundException('Maestro no encontrado');
    }

    // Find all project IDs where this teacher is the owner or a member with role 'teacher'
    const [ownedProjects, memberProjects] = await Promise.all([
      this.prisma.project.findMany({
        where: { userId: teacherId, classroomId: { not: null } },
        select: { classroomId: true },
      }),
      this.prisma.projectMember.findMany({
        where: { userId: teacherId, role: 'teacher' },
        include: {
          project: { select: { classroomId: true } },
        },
      }),
    ]);

    // Collect distinct classroom IDs where this teacher teaches
    const teacherClassroomIds = [
      ...new Set([
        ...ownedProjects.map((p) => p.classroomId).filter(Boolean),
        ...memberProjects.map((m) => m.project.classroomId).filter(Boolean),
      ]),
    ] as string[];

    // Apply classroom filter if provided
    const filteredClassroomIds = classroomId
      ? teacherClassroomIds.filter((id) => id === classroomId)
      : teacherClassroomIds;

    if (filteredClassroomIds.length === 0) {
      return { data: [], total: 0, page, limit };
    }

    // Query DISTINCT students in those classrooms
    const where: Prisma.UserWhereInput = {
      role: 'STUDENT',
      classroomId: { in: filteredClassroomIds },
    };

    const [students, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          email: true,
          avatarUrl: true,
          classroomId: true,
          classroom: { select: { name: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { fullName: 'asc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: students.map((s) => ({
        id: s.id,
        fullName: s.fullName,
        email: s.email,
        avatarUrl: s.avatarUrl,
        classroomId: s.classroomId,
        classroomName: s.classroom?.name || null,
      })),
      total,
      page,
      limit,
    };
  }

  /**
   * Get subjects assigned to a teacher with classroom context, student counts, and stats.
   * Subjects are Projects where the teacher is the owner or a ProjectMember with role 'teacher'.
   */
  async getTeacherSubjects(
    teacherId: string,
    options: { page?: number; limit?: number } = {},
  ) {
    const { page = 1, limit = 20 } = options;

    const teacher = await this.prisma.user.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new NotFoundException('Maestro no encontrado');
    }

    // Find all projects (subjects) where this teacher is owner or member with role 'teacher'
    // Only include projects that belong to a classroom (i.e., are subjects)
    const where: Prisma.ProjectWhereInput = {
      classroomId: { not: null },
      OR: [
        { userId: teacherId },
        { members: { some: { userId: teacherId, role: 'teacher' } } },
      ],
    };

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        include: {
          classroom: {
            select: { name: true, id: true },
            },
          _count: { select: { tasks: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.project.count({ where }),
    ]);

    // For each project, get student count (students in the classroom) and avg grade
    const data = await Promise.all(
      projects.map(async (project) => {
        const [studentCount, gradeData] = await Promise.all([
          this.prisma.user.count({
            where: {
              role: 'STUDENT',
              classroomId: project.classroomId!,
            },
          }),
          this.prisma.submission.aggregate({
            where: {
              task: { projectId: project.id },
              status: 'GRADED',
            },
            _avg: { grade: true },
          }),
        ]);

        return {
          id: project.id,
          name: project.name,
          classroomId: project.classroom?.id || null,
          classroomName: project.classroom?.name || null,
          studentCount,
          taskCount: project._count.tasks,
          avgGrade: gradeData._avg.grade || null,
        };
      }),
    );

    return { data, total, page, limit };
  }

  async findByIdentityCode(code: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { identityCode: code },
    });
  }

  async generateIdentityCode(userId: string): Promise<string> {
    const code = `HW-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    
    // Verificar que no existe
    const existing = await this.prisma.user.findUnique({ where: { identityCode: code } });
    if (existing) {
      return this.generateIdentityCode(userId); // Reintentar
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { identityCode: code },
    });

    return code;
  }

  /**
   * Get paginated tickets for a user (created by or assigned to them).
   * Supports filtering by status, category, and priority.
   * Note: priority filtering is accepted but the Ticket model currently has no priority field,
   * so it is a no-op until the schema is extended.
   */
  async getUserTickets(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      status?: string;
      category?: string;
      priority?: string;
    } = {},
  ) {
    const { page = 1, limit = 20, status, category } = options;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Build where clause: tickets created by OR assigned to this user
    const where: Prisma.TicketWhereInput = {
      OR: [{ createdById: userId }, { assignedToId: userId }],
    };

    // Apply optional filters
    if (status) {
      where.status = status as any;
    }
    if (category) {
      where.category = category;
    }

    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatarUrl: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatarUrl: true,
            },
          },
          review: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return {
      data: tickets,
      total,
      page,
      limit,
    };
  }

  private readonly defaultNotificationPreferences: NotificationPreferencesDto = {
    assignments: true,
    grades: true,
    messages: true,
    system: true,
    deadlines: true,
    emailNotifications: false,
  };

  async getNotificationPreferences(userId: string): Promise<NotificationPreferencesDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { notificationPreferences: true },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (!user.notificationPreferences) {
      return { ...this.defaultNotificationPreferences };
    }

    const stored = user.notificationPreferences as Record<string, unknown>;
    return {
      assignments: typeof stored.assignments === 'boolean' ? stored.assignments : this.defaultNotificationPreferences.assignments,
      grades: typeof stored.grades === 'boolean' ? stored.grades : this.defaultNotificationPreferences.grades,
      messages: typeof stored.messages === 'boolean' ? stored.messages : this.defaultNotificationPreferences.messages,
      system: typeof stored.system === 'boolean' ? stored.system : this.defaultNotificationPreferences.system,
      deadlines: typeof stored.deadlines === 'boolean' ? stored.deadlines : this.defaultNotificationPreferences.deadlines,
      emailNotifications: typeof stored.emailNotifications === 'boolean' ? stored.emailNotifications : this.defaultNotificationPreferences.emailNotifications,
    };
  }

  async updateNotificationPreferences(
    userId: string,
    preferences: NotificationPreferencesDto,
  ): Promise<NotificationPreferencesDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const preferencesData: NotificationPreferencesDto = {
      assignments: Boolean(preferences.assignments),
      grades: Boolean(preferences.grades),
      messages: Boolean(preferences.messages),
      system: Boolean(preferences.system),
      deadlines: Boolean(preferences.deadlines),
      emailNotifications: Boolean(preferences.emailNotifications),
    };

    await this.prisma.user.update({
      where: { id: userId },
      data: { notificationPreferences: preferencesData as unknown as Prisma.JsonObject },
    });

    return preferencesData;
  }

}

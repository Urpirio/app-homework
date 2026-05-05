import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubjectsService {
  constructor(private prisma: PrismaService) {}
  async create(classId: string, user: any, data: { name: string; teacherIds: string[] }) {
    // Only admins can create subjects in classrooms
    if (user.role !== Role.SUPER_ADMIN && user.role !== Role.SCHOOL_ADMIN) {
      throw new ForbiddenException('No tienes permiso para crear materias');
    }

    const classroom = await this.prisma.classroom.findUnique({
      where: { id: classId },
      include: { students: { select: { id: true } } },
    });

    if (!classroom) {
      throw new NotFoundException('Aula no encontrada');
    }

    // Create the project (Subject)
    const project = await this.prisma.project.create({
      data: {
        name: data.name,
        institutionId: classroom.institutionId,
        classroomId: classId,
        userId: user.userId, // The creator is the primary owner
      },
    });

    // Add teachers as members
    const memberOperations: any[] = [];
    if (data.teacherIds && data.teacherIds.length > 0) {
      data.teacherIds.forEach(teacherId =>
        memberOperations.push(
          this.prisma.projectMember.create({
            data: { projectId: project.id, userId: teacherId, role: 'teacher' },
          })
        )
      );
    }

    // Add all classroom students as members
    if (classroom.students.length > 0) {
      classroom.students.forEach(student =>
        memberOperations.push(
          this.prisma.projectMember.create({
            data: { projectId: project.id, userId: student.id, role: 'student' },
          })
        )
      );
    }

    if (memberOperations.length > 0) {
      await Promise.all(memberOperations);
    }

    return this.findOne(project.id);
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        classroom: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                role: true,
              },
            },
          },
        },
        units: {
          include: {
            _count: { select: { tasks: true } }
          }
        },
        _count: {
          select: { tasks: true, members: true },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Materia no encontrada');
    }

    const recentSubmissions = await this.prisma.submission.findMany({
      where: { task: { projectId: id } },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        student: { select: { fullName: true } },
        task: { select: { title: true } }
      }
    });

    return {
      ...project,
      teachers: project.members
        .filter(m => m.role === 'teacher')
        .map(m => ({
          ...m.user,
          projectId: m.projectId
        })),
      recentSubmissions: recentSubmissions.map(s => ({
        id: s.id,
        studentName: s.student.fullName,
        taskName: s.task.title,
        status: s.status,
        grade: s.grade,
        createdAt: s.createdAt
      }))
    };
  }

  async update(
    id: string,
    user: any,
    data: { name?: string; description?: string; color?: string; icon?: string; teacherIds?: string[] },
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        members: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Materia no encontrada');
    }

    // TEACHER can only update subjects they own or are a member of
    if (user.role === Role.TEACHER) {
      const isMember = project.members.some(m => m.userId === user.userId);
      const isOwner = project.userId === user.userId;
      if (!isMember && !isOwner) {
        throw new ForbiddenException('No tienes permiso para editar esta materia');
      }
    }

    // Update project fields
    const { teacherIds, ...projectData } = data;
    const updatedProject = await this.prisma.project.update({
      where: { id },
      data: projectData,
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                role: true,
              },
            },
          },
        },
        _count: {
          select: { tasks: true, members: true },
        },
      },
    });

    // Update teacher assignments if provided
    if (teacherIds !== undefined) {
      // Remove existing teacher members
      await this.prisma.projectMember.deleteMany({
        where: { projectId: id, role: 'teacher' },
      });

      // Add new teacher members
      if (teacherIds.length > 0) {
        await Promise.all(
          teacherIds.map(teacherId =>
            this.prisma.projectMember.create({
              data: {
                projectId: id,
                userId: teacherId,
                role: 'teacher',
              },
            }),
          ),
        );
      }
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        _count: {
          select: { tasks: true, units: true, members: true },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Materia no encontrada');
    }

    // Cascading delete: Prisma schema has onDelete: Cascade for tasks, units, members, messages, schedules
    // Tasks cascade to submissions via onDelete: Cascade on Task model
    // So deleting the project cascades through: project -> tasks -> submissions, project -> units, project -> members, etc.
    await this.prisma.project.delete({
      where: { id },
    });

    return { message: 'Materia eliminada exitosamente' };
  }

  async getTasks(id: string) {
    return this.prisma.task.findMany({
      where: { projectId: id },
      include: {
        _count: {
          select: { submissions: true },
        },
      },
    });
  }

  async getStats(id: string) {
    const [submissions, totalTasks, submittedTasks, studentCount] = await Promise.all([
      this.prisma.submission.aggregate({
        where: { task: { projectId: id }, status: 'GRADED' },
        _avg: { grade: true },
      }),
      this.prisma.task.count({ where: { projectId: id } }),
      this.prisma.submission.count({ where: { task: { projectId: id } } }),
      this.prisma.projectMember.count({ where: { projectId: id, role: 'student' } }),
    ]);

    return {
      avgGrade: submissions._avg.grade || 0,
      totalTasks,
      submittedTasks,
      studentCount: studentCount || 0,
    };
  }

  async getChats(userId: string, userRole: Role, userClassroomId?: string, userInstitutionId?: string) {
    // Look up user details for classroom/institution context
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { classroomId: true, institutionId: true },
    });

    const effectiveClassroomId = userClassroomId || user?.classroomId;

    // Find all subjects (projects with classroomId set) the user has access to
    const whereConditions: any[] = [];

    // User is the owner/creator of the subject
    whereConditions.push({ userId });

    // User is a project member
    whereConditions.push({
      members: {
        some: { userId },
      },
    });

    // Students: subjects in their classroom
    if (userRole === Role.STUDENT && effectiveClassroomId) {
      whereConditions.push({ classroomId: effectiveClassroomId });
    }

    const subjects = await this.prisma.project.findMany({
      where: {
        classroomId: { not: null },
        OR: whereConditions,
      },
      include: {
        classroom: {
          select: { id: true, name: true },
        },
        members: {
          select: { userId: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: { id: true, fullName: true },
            },
          },
        },
        _count: {
          select: { members: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return subjects.map((subject) => {
      const lastMessage = subject.messages[0] || null;
      const memberCount = subject._count.members;

      return {
        id: subject.id,
        name: subject.name,
        classroomId: subject.classroom?.id || null,
        classroomName: subject.classroom?.name || null,
        participantCount: memberCount,
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              text: lastMessage.text,
              senderId: lastMessage.senderId,
              senderName: lastMessage.sender.fullName,
              createdAt: lastMessage.createdAt,
            }
          : null,
      };
    });
  }
}

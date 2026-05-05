import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType, Prisma, TaskType } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(userId: string, data: any) {
    let status = data.status;
    if (status) {
      status = status.toUpperCase().replace(/-/g, '_');
    }
    const task = await this.prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        status: status,
        type: data.type as TaskType,
        maxGrade: data.maxGrade,
        project: { connect: { id: data.projectId } },
        unit: data.unitId ? { connect: { id: data.unitId } } : undefined,
        dueDate: data.dueDate,
        startDate: data.startDate,
        resources: data.resources,
      },
      include: { project: true },
    });

    await this.notificationsService.create({
      title: 'Nueva Tarea',
      message: `Se ha creado la tarea "${task.title}" en el proyecto "${task.project.name}"`,
      type: NotificationType.TASK,
      userId,
    });

    return task;
  }

  async findAllByProject(projectId: string, userId: string) {
    return this.prisma.task.findMany({
      where: { 
        projectId,
        project: { userId }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    // First try to find the task with direct ownership or membership
    const task = await this.prisma.task.findFirst({
      where: {
        id,
        OR: [
          { project: { userId } },
          { project: { members: { some: { userId } } } },
          // Also allow access if the project belongs to the student's classroom
          {
            project: {
              classroom: {
                students: { some: { id: userId } },
              },
            },
          },
        ],
      },
      include: {
        project: {
          include: { user: { select: { fullName: true } } }
        },
        unit: true,
        submissions: {
          where: { studentId: userId },
          take: 1
        }
      },
    });
    return task;
  }

  async update(id: string, userId: string, data: any) {
    // Verificar que la tarea pertenece al usuario
    const existingTask = await this.prisma.task.findFirst({
      where: { id, project: { userId } },
    });

    if (!existingTask) {
      throw new Error('Task not found or unauthorized');
    }

    let status = data.status;
    if (status) {
      status = status.toUpperCase().replace(/-/g, '_');
    }

    const task = await this.prisma.task.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        status: status,
        type: data.type as TaskType,
        maxGrade: data.maxGrade,
        unit: data.unitId ? { connect: { id: data.unitId } } : (data.unitId === null ? { disconnect: true } : undefined),
        dueDate: data.dueDate,
        startDate: data.startDate,
        resources: data.resources,
      },
      include: { project: true },
    });

    if (status === 'DONE' && existingTask.status !== 'DONE') {
      await this.notificationsService.create({
        title: 'Tarea Completada',
        message: `Has completado la tarea "${task.title}"`,
        type: NotificationType.TASK,
        userId,
      });
    }

    return task;
  }

  async remove(id: string, userId: string) {
    // Verificar propiedad antes de eliminar
    const task = await this.prisma.task.findFirst({
      where: { id, project: { userId } },
    });

    if (!task) {
      throw new Error('Task not found or unauthorized');
    }

    return this.prisma.task.delete({
      where: { id },
    });
  }


    /**
     * Get paginated tasks within a unit, with optional status and deadline filtering.
     * Returns tasks with submission counts and whether the current user has submitted.
     */
    async getUnitTasks(
      unitId: string,
      options: {
        page?: number;
        limit?: number;
        status?: string;
        deadlineBefore?: string;
        deadlineAfter?: string;
        userId?: string;
      } = {},
    ) {
      const { page = 1, limit = 15, status, deadlineBefore, deadlineAfter, userId } = options;

      const unit = await this.prisma.unit.findUnique({ where: { id: unitId } });
      if (!unit) throw new NotFoundException('Unidad no encontrada');

      const where: Prisma.TaskWhereInput = { unitId };
      if (status) where.status = status.toUpperCase().replace(/-/g, '_') as any;
      if (deadlineBefore || deadlineAfter) {
        where.dueDate = {};
        if (deadlineBefore) (where.dueDate as any).lte = new Date(deadlineBefore);
        if (deadlineAfter) (where.dueDate as any).gte = new Date(deadlineAfter);
      }

      const [tasks, total] = await Promise.all([
        this.prisma.task.findMany({
          where,
          include: {
            _count: { select: { submissions: true } },
            // Include the current user's submission if userId is provided
            ...(userId && {
              submissions: {
                where: { studentId: userId },
                select: { id: true, status: true, grade: true, createdAt: true },
                take: 1,
              },
            }),
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.task.count({ where }),
      ]);

      return {
        data: tasks.map((task) => ({
          id: task.id,
          title: task.title,
          status: task.status,
          type: task.type,
          dueDate: task.dueDate ? task.dueDate.toISOString() : null,
          maxGrade: task.maxGrade,
          submissionCount: task._count.submissions,
          // Per-student submission status
          mySubmission: userId && (task as any).submissions?.[0]
            ? {
                id: (task as any).submissions[0].id,
                status: (task as any).submissions[0].status,
                grade: (task as any).submissions[0].grade,
                createdAt: (task as any).submissions[0].createdAt,
              }
            : null,
        })),
        total,
        page,
        limit,
      };
    }

    /**
     * Get tasks for calendar view within a date range, filtered by user role.
     * - STUDENT: tasks from projects in the student's classroom (project.classroomId = user.classroomId)
     * - TEACHER: tasks from projects the teacher owns or is a member of
     * - SUPER_ADMIN / SCHOOL_ADMIN: all tasks within their institution scope
     */
    async getCalendarTasks(
      userId: string,
      role: string,
      options: {
        startDate?: string;
        endDate?: string;
      } = {},
    ) {
      const { startDate, endDate } = options;

      // Build the dueDate filter
      const dueDateFilter: Prisma.DateTimeNullableFilter = {};
      if (startDate) {
        dueDateFilter.gte = new Date(startDate);
      }
      if (endDate) {
        dueDateFilter.lte = new Date(endDate);
      }

      // Build role-based project filter
      let projectFilter: Prisma.ProjectWhereInput;

      switch (role) {
        case 'STUDENT': {
          // Tasks from projects the student owns or is a member of
          // (same logic as GET /projects for consistency)
          projectFilter = {
            OR: [
              { userId },
              { members: { some: { userId } } },
            ],
          };
          break;
        }
        case 'TEACHER': {
          // Tasks from projects the teacher owns or is a member of
          projectFilter = {
            OR: [
              { userId },
              { members: { some: { userId } } },
            ],
          };
          break;
        }
        case 'SUPER_ADMIN':
        case 'SCHOOL_ADMIN': {
          // All tasks within the admin's institution
          const admin = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { institutionId: true },
          });
          projectFilter = admin?.institutionId
            ? { institutionId: admin.institutionId }
            : {};
          break;
        }
        default: {
          projectFilter = { id: '__none__' };
          break;
        }
      }

      const where: Prisma.TaskWhereInput = {
        dueDate: Object.keys(dueDateFilter).length > 0 ? dueDateFilter : { not: null },
        project: projectFilter,
      };

      const tasks = await this.prisma.task.findMany({
        where,
        include: {
          project: {
            select: { name: true, color: true },
          },
        },
        orderBy: { dueDate: 'asc' },
      });

      return {
        tasks: tasks.map((task) => ({
          id: task.id,
          title: task.title,
          dueDate: task.dueDate ? task.dueDate.toISOString() : null,
          status: task.status,
          projectName: task.project.name,
          projectColor: task.project.color,
        })),
      };
    }

  async getSubmissions(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true }
    });

    if (!task) throw new Error('Tarea no encontrada');

    return this.prisma.submission.findMany({
      where: { taskId },
      include: { 
        student: { 
          select: { id: true, fullName: true, email: true, avatarUrl: true } 
        } 
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}

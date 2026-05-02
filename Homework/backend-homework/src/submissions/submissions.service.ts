import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, Role, SubmissionStatus } from '@prisma/client';

@Injectable()
export class SubmissionsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async submit(userId: string, data: { taskId: string; fileUrl?: string; content?: string }) {
    const task = await this.prisma.task.findUnique({
      where: { id: data.taskId },
      include: { project: true },
    });

    if (!task) {
      throw new NotFoundException('Tarea no encontrada');
    }

    // Verificar que el estudiante pertenece al aula
    const isMember = await this.prisma.projectMember.findFirst({
      where: { projectId: task.projectId, userId },
    });
    if (!isMember && task.project.userId !== userId) {
      throw new ForbiddenException('No estás inscrito en esta aula');
    }

    return this.prisma.submission.upsert({
      where: {
        taskId_studentId: {
          taskId: data.taskId,
          studentId: userId,
        },
      },
      update: {
        fileUrl: data.fileUrl,
        content: data.content,
        status: SubmissionStatus.SUBMITTED,
        updatedAt: new Date(),
      },
      create: {
        task: { connect: { id: data.taskId } },
        student: { connect: { id: userId } },
        fileUrl: data.fileUrl,
        content: data.content,
        status: SubmissionStatus.SUBMITTED,
      },
    });
  }

  async grade(teacherId: string, submissionId: string, data: { grade: number; feedback?: string }) {
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      include: { task: { include: { project: true } } },
    });

    if (!submission) {
      throw new NotFoundException('Entrega no encontrada');
    }

    // Verificar que el usuario es el dueño del aula o un profesor asignado
    if (submission.task.project.userId !== teacherId) {
      const isTeacher = await this.prisma.projectMember.findFirst({
        where: { 
          projectId: submission.task.projectId, 
          userId: teacherId,
          role: 'teacher' // O cualquier lógica de rol en la membresía
        },
      });
      if (!isTeacher) {
        throw new ForbiddenException('No tienes permisos para calificar esta tarea');
      }
    }

    const updatedSubmission = await this.prisma.submission.update({
      where: { id: submissionId },
      data: {
        grade: data.grade,
        feedback: data.feedback,
        status: SubmissionStatus.GRADED,
      },
    });

    // Notificar al estudiante
    await this.notificationsService.create({
      title: 'Tarea Calificada',
      message: `Tu entrega para "${submission.task.title}" ha sido calificada con ${data.grade}`,
      type: NotificationType.SUBMISSION_GRADED,
      userId: submission.studentId,
    });

    return updatedSubmission;
  }

  async findByTask(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task) {
      throw new NotFoundException('Tarea no encontrada');
    }

    // Solo el profesor o el dueño pueden ver todas las entregas
    if (task.project.userId === userId) {
      return this.prisma.submission.findMany({
        where: { taskId },
        include: { student: { select: { id: true, fullName: true, email: true } } },
      });
    }

    // El estudiante solo puede ver su propia entrega
    return this.prisma.submission.findMany({
      where: { taskId, studentId: userId },
    });
  }
}

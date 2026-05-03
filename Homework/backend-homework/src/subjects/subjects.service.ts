import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Role } from '@prisma/client';

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
    if (data.teacherIds && data.teacherIds.length > 0) {
      await Promise.all(
        data.teacherIds.map(teacherId =>
          this.prisma.projectMember.create({
            data: {
              projectId: project.id,
              userId: teacherId,
              role: 'teacher',
            },
          })
        )
      );
    }

    return project;
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        tasks: true,
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

    if (!project) {
      throw new NotFoundException('Materia no encontrada');
    }

    return project;
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
    const submissions = await this.prisma.submission.aggregate({
      where: { task: { projectId: id }, status: 'GRADED' },
      _avg: { grade: true },
    });

    return {
      avgGrade: submissions._avg.grade || 0,
    };
  }
}

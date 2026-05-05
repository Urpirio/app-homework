import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Role } from '@prisma/client';

@Injectable()
export class ClassroomsService {
  constructor(private prisma: PrismaService) {}

  async create(user: any, data: Omit<Prisma.ClassroomCreateInput, 'institution'>) {
    // Only admins can create classrooms
    if (user.role !== Role.SUPER_ADMIN && user.role !== Role.SCHOOL_ADMIN) {
      throw new ForbiddenException('No tienes permiso para crear aulas');
    }

    const institutionId = user.role === Role.SUPER_ADMIN ? (data as any).institutionId : user.institutionId;

    if (!institutionId) {
      throw new NotFoundException('Se requiere el ID de la institución');
    }

    return this.prisma.classroom.create({
      data: {
        ...data,
        institution: { connect: { id: institutionId } },
      } as any,
    });
  }

  async findAllForInstitution(institutionId: string) {
    return this.prisma.classroom.findMany({
      where: { institutionId },
      include: {
        _count: {
          select: { students: true, projects: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const classroom = await this.prisma.classroom.findUnique({
      where: { id },
      include: {
        institution: true,
        students: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
        projects: {
          include: {
            user: {
              select: {
                fullName: true,
              },
            },
            _count: {
              select: { tasks: true },
            },
          },
        },
      },
    });

    if (!classroom) {
      throw new NotFoundException('Aula no encontrada');
    }

    return classroom;
  }

  async update(id: string, user: any, data: Prisma.ClassroomUpdateInput) {
    const classroom = await this.findOne(id);

    if (user.role !== Role.SUPER_ADMIN && (user.role !== Role.SCHOOL_ADMIN || user.institutionId !== classroom.institutionId)) {
      throw new ForbiddenException('No tienes permiso para actualizar esta aula');
    }

    return this.prisma.classroom.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, user: any) {
    const classroom = await this.findOne(id);

    if (user.role !== Role.SUPER_ADMIN && (user.role !== Role.SCHOOL_ADMIN || user.institutionId !== classroom.institutionId)) {
      throw new ForbiddenException('No tienes permiso para eliminar esta aula');
    }

    return this.prisma.classroom.delete({
      where: { id },
    });
  }

  async addStudent(id: string, studentId: string) {
    return this.prisma.classroom.update({
      where: { id },
      data: {
        students: {
          connect: { id: studentId },
        },
      },
    });
  }

  async removeStudent(id: string, studentId: string) {
    return this.prisma.classroom.update({
      where: { id },
      data: {
        students: {
          disconnect: { id: studentId },
        },
      },
    });
  }

  async getSubjects(id: string) {
    const classroom = await this.prisma.classroom.findUnique({
      where: { id },
      include: {
        projects: {
          include: {
            user: {
              select: { fullName: true },
            },
          },
        },
      },
    });

    if (!classroom) {
      throw new NotFoundException('Aula no encontrada');
    }

    return classroom.projects.map(p => ({
      id: p.id,
      name: p.name,
      teacher: p.user.fullName,
      // Here we could calculate avgGrade if we had the logic
      avgGrade: 0, 
    }));
  }
}

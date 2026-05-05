import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Role } from '@prisma/client';

@Injectable()
export class ClassroomsService {
  constructor(private prisma: PrismaService) {}

  async create(user: any, data: any) {
    // Only admins can create classrooms
    if (user.role !== Role.SUPER_ADMIN && user.role !== Role.SCHOOL_ADMIN) {
      throw new ForbiddenException('No tienes permiso para crear aulas');
    }

    const { institutionId: bodyInstitutionId, ...rest } = data;
    const institutionId = user.role === Role.SUPER_ADMIN ? bodyInstitutionId : user.institutionId;

    if (!institutionId) {
      throw new NotFoundException('Se requiere el ID de la institución');
    }

    return this.prisma.classroom.create({
      data: {
        ...rest,
        institution: { connect: { id: institutionId } },
      },
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
        _count: {
          select: { students: true, projects: true },
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
    const classroom = await this.prisma.classroom.findUnique({
      where: { id },
      include: { projects: true },
    });

    if (!classroom) throw new NotFoundException('Aula no encontrada');

    // Add student to classroom
    await this.prisma.classroom.update({
      where: { id },
      data: {
        students: {
          connect: { id: studentId },
        },
      },
    });

    // Add student to all projects (subjects) in the classroom
    const projectMemberships = classroom.projects.map((project) => ({
      projectId: project.id,
      userId: studentId,
      role: 'student',
    }));

    if (projectMemberships.length > 0) {
      await this.prisma.projectMember.createMany({
        data: projectMemberships,
        skipDuplicates: true,
      });
    }

    return { message: 'Estudiante inscrito correctamente' };
  }

  async removeStudent(id: string, studentId: string) {
    const classroom = await this.prisma.classroom.findUnique({
      where: { id },
      include: { projects: true },
    });

    if (!classroom) throw new NotFoundException('Aula no encontrada');

    // Remove student from classroom
    await this.prisma.classroom.update({
      where: { id },
      data: {
        students: {
          disconnect: { id: studentId },
        },
      },
    });

    // Remove student from all projects in the classroom
    const projectIds = classroom.projects.map((p) => p.id);
    await this.prisma.projectMember.deleteMany({
      where: {
        userId: studentId,
        projectId: { in: projectIds },
      },
    });

    return { message: 'Estudiante eliminado correctamente' };
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
            _count: {
              select: { tasks: true, members: true },
            },
          },
        },
        _count: {
          select: { students: true },
        },
      },
    });

    if (!classroom) {
      throw new NotFoundException('Aula no encontrada');
    }

    return classroom.projects.map(p => ({
      id: p.id,
      name: p.name,
      teacher: p.user?.fullName || 'Sin profesor',
      taskCount: p._count?.tasks ?? 0,
      studentCount: classroom._count?.students ?? 0, // Consistency: Use the classroom's student count
      avgGrade: 0, 
    }));
  }
}

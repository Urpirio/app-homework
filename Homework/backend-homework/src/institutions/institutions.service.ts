import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InstitutionsService {
  constructor(private prisma: PrismaService) {}

  async create(data: { name: string; logoUrl?: string; address?: string }) {
    return this.prisma.institution.create({
      data,
    });
  }

  async findAll() {
    return this.prisma.institution.findMany({
      include: {
        _count: {
          select: { users: true, projects: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const institution = await this.prisma.institution.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
        projects: true,
      },
    });

    if (!institution) {
      throw new NotFoundException('Institución no encontrada');
    }

    return institution;
  }

  async update(id: string, data: { name?: string; logoUrl?: string; address?: string }) {
    const institution = await this.prisma.institution.findUnique({
      where: { id },
    });

    if (!institution) {
      throw new NotFoundException('Institución no encontrada');
    }

    return this.prisma.institution.update({
      where: { id },
      data,
      include: {
        _count: {
          select: { users: true, projects: true },
        },
      },
    });
  }

  async softDelete(id: string) {
    const institution = await this.prisma.institution.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true, classrooms: true, projects: true },
        },
      },
    });

    if (!institution) {
      throw new NotFoundException('Institución no encontrada');
    }

    // Cascading deactivation: deactivate all users in this institution
    await this.prisma.user.updateMany({
      where: { institutionId: id },
      data: { isVerified: false },
    });

    // Delete the institution (cascading deletes handle classrooms, projects, etc.)
    await this.prisma.institution.delete({
      where: { id },
    });

    return { message: 'Institución eliminada exitosamente' };
  }

  async assignAdmin(institutionId: string, userId: string) {
    const institution = await this.prisma.institution.findUnique({
      where: { id: institutionId },
    });

    if (!institution) {
      throw new NotFoundException('Institución no encontrada');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (user.institutionId !== institutionId) {
      throw new BadRequestException('El usuario no pertenece a esta institución');
    }

    if (user.role === Role.SUPER_ADMIN) {
      throw new BadRequestException('No se puede asignar rol SCHOOL_ADMIN a un SUPER_ADMIN');
    }

    if (user.role === Role.SCHOOL_ADMIN) {
      throw new BadRequestException('El usuario ya tiene el rol SCHOOL_ADMIN');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role: Role.SCHOOL_ADMIN },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
      },
    });
  }

  async removeAdmin(institutionId: string, adminId: string) {
    const institution = await this.prisma.institution.findUnique({
      where: { id: institutionId },
    });

    if (!institution) {
      throw new NotFoundException('Institución no encontrada');
    }

    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      throw new NotFoundException('Administrador no encontrado');
    }

    if (admin.institutionId !== institutionId) {
      throw new BadRequestException('El administrador no pertenece a esta institución');
    }

    if (admin.role !== Role.SCHOOL_ADMIN) {
      throw new BadRequestException('El usuario no tiene el rol SCHOOL_ADMIN');
    }

    // Minimum-admin validation: ensure at least one admin remains
    const adminCount = await this.prisma.user.count({
      where: { institutionId, role: Role.SCHOOL_ADMIN },
    });

    if (adminCount <= 1) {
      throw new BadRequestException('No se puede eliminar el último administrador de la institución');
    }

    return this.prisma.user.update({
      where: { id: adminId },
      data: { role: Role.TEACHER },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
      },
    });
  }

  async getStats(id: string) {
    const [students, teachers, classrooms, avgGradeData] = await Promise.all([
      this.prisma.user.count({ where: { institutionId: id, role: Role.STUDENT } }),
      this.prisma.user.count({ where: { institutionId: id, role: Role.TEACHER } }),
      this.prisma.classroom.count({ where: { institutionId: id } }),
      this.prisma.submission.aggregate({
        where: { student: { institutionId: id }, status: 'GRADED' },
        _avg: { grade: true },
      }),
    ]);

    return {
      students,
      teachers,
      classrooms,
      avgGrade: avgGradeData._avg.grade || 0,
    };
  }

  async getStudents(id: string) {
    return this.prisma.user.findMany({
      where: { institutionId: id, role: Role.STUDENT },
      select: {
        id: true,
        fullName: true,
        email: true,
        avatarUrl: true,
        classroom: { select: { name: true } },
      },
    });
  }

  async getTeachers(id: string) {
    return this.prisma.user.findMany({
      where: { institutionId: id, role: Role.TEACHER },
      select: {
        id: true,
        fullName: true,
        email: true,
        avatarUrl: true,
        specialty: true,
      },
    });
  }

  async getAdmins(id: string) {
    return this.prisma.user.findMany({
      where: { institutionId: id, role: Role.SCHOOL_ADMIN },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
      },
    });
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

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

  async getStats(id: string) {
    const [students, teachers, classrooms] = await Promise.all([
      this.prisma.user.count({ where: { institutionId: id, role: Role.STUDENT } }),
      this.prisma.user.count({ where: { institutionId: id, role: Role.TEACHER } }),
      this.prisma.project.count({ where: { institutionId: id } }),
    ]);

    return {
      students,
      teachers,
      classrooms,
    };
  }
}

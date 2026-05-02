import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';

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

  async getUserStats(userId: string) {
    const [ownedProjects, memberProjects, ownedTasks, memberTasks] = await Promise.all([
      this.prisma.project.count({ where: { userId } }),
      this.prisma.project.count({ where: { members: { some: { userId } } } }),
      this.prisma.task.count({ where: { project: { userId } } }),
      this.prisma.task.count({ where: { project: { members: { some: { userId } } } } }),
    ]);
    return { 
      projects: ownedProjects + memberProjects, 
      tasks: ownedTasks + memberTasks 
    };
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
}

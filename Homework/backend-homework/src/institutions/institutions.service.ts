import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { EnrollStudentDto } from './dto/enroll-student.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class InstitutionsService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
  ) {}

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

  async getAnalytics(id: string) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [
      students,
      tasks,
      submissions,
      gradedSubmissions,
    ] = await Promise.all([
      this.prisma.user.findMany({
        where: { institutionId: id, role: Role.STUDENT, createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true },
      }),
      this.prisma.task.count({
        where: { project: { institutionId: id } },
      }),
      this.prisma.submission.findMany({
        where: { student: { institutionId: id } },
        select: { status: true, grade: true, createdAt: true, updatedAt: true },
      }),
      this.prisma.user.count({
        where: { institutionId: id, role: Role.STUDENT },
      }),
    ]);

    // 1. Enrollment Trend (Last 6 Months)
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const trendMap = new Map<string, number>();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthLabel = monthNames[d.getMonth()];
      trendMap.set(monthLabel, 0);
    }

    students.forEach(s => {
      const monthLabel = monthNames[s.createdAt.getMonth()];
      if (trendMap.has(monthLabel)) {
        trendMap.set(monthLabel, (trendMap.get(monthLabel) || 0) + 1);
      }
    });

    const enrollmentTrend = {
      labels: Array.from(trendMap.keys()),
      data: Array.from(trendMap.values()),
    };

    // 2. Grade Distribution
    const ranges = ['0-20', '21-40', '41-60', '61-80', '81-100'];
    const distData = [0, 0, 0, 0, 0];

    submissions.forEach(s => {
      if (s.status === 'GRADED' && s.grade !== null) {
        const g = s.grade;
        if (g <= 20) distData[0]++;
        else if (g <= 40) distData[1]++;
        else if (g <= 60) distData[2]++;
        else if (g <= 80) distData[3]++;
        else distData[4]++;
      }
    });

    const gradeDistribution = {
      labels: ranges,
      data: distData,
    };

    // 3. Task Completion
    const done = submissions.filter(s => s.status === 'GRADED').length;
    const inProgress = submissions.filter(s => s.status === 'SUBMITTED').length;
    const totalExpected = gradedSubmissions * tasks;
    const todo = Math.max(0, totalExpected - (done + inProgress));

    const taskCompletion = { todo, inProgress, done };

    // 4. KPIs
    let totalResponseTime = 0;
    let gradedCount = 0;
    submissions.forEach(s => {
      if (s.status === 'GRADED') {
        const diff = (s.updatedAt.getTime() - s.createdAt.getTime()) / (1000 * 60); // minutes
        totalResponseTime += diff;
        gradedCount++;
      }
    });

    const avgResponseTime = gradedCount > 0 ? Math.round(totalResponseTime / gradedCount) : 0;
    const submissionRate = totalExpected > 0 ? Math.round(((done + inProgress) / totalExpected) * 100) : 0;
    const engagementScore = gradedSubmissions > 0 ? Math.min(100, Math.round((submissions.length / gradedSubmissions) * 20)) : 0; // Arbitrary score: 5 submissions per student = 100%

    return {
      enrollmentTrend,
      gradeDistribution,
      taskCompletion,
      kpis: {
        avgResponseTime,
        submissionRate,
        engagementScore,
      },
    };
  }

  async enrollStudent(institutionId: string, data: EnrollStudentDto) {
    const institution = await this.prisma.institution.findUnique({
      where: { id: institutionId },
    });

    if (!institution) {
      throw new NotFoundException('Institución no encontrada');
    }

    const existingUser = await this.usersService.findOne(data.email);
    if (existingUser) {
      throw new BadRequestException('El estudiante ya está registrado');
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash('temp1234', salt);

    const newUser = await this.usersService.create({
      email: data.email,
      fullName: data.fullName,
      password: hashedPassword,
      role: Role.STUDENT,
      institution: { connect: { id: institutionId } },
      isVerified: true,
      parentName: data.parentName,
      parentPhone: data.parentPhone,
      bio: data.bio,
      ...(data.classroomId ? { classroom: { connect: { id: data.classroomId } } } : {}),
    });

    await this.usersService.generateIdentityCode(newUser.id);

    return this.usersService.findById(newUser.id);
  }
}

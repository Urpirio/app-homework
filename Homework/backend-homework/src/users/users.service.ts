import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User, Role } from '@prisma/client';

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
    const [ownedProjects, memberProjects, submissions] = await Promise.all([
      this.prisma.project.count({ where: { userId } }),
      this.prisma.project.count({ where: { members: { some: { userId } } } }),
      this.prisma.submission.aggregate({
        where: { studentId: userId, status: 'GRADED' },
        _avg: { grade: true },
        _count: { id: true },
      }),
    ]);
    return { 
      projects: ownedProjects + memberProjects, 
      avgGrade: submissions._avg.grade || 0,
      completedTasks: submissions._count.id || 0,
    };
  }

  async getStudentProfile(studentId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: studentId },
      include: {
        classroom: true,
        submissions: {
          include: {
            task: {
              include: {
                project: {
                  include: { user: { select: { fullName: true } } }
                }
              }
            }
          }
        }
      }
    });

    if (!user) return null;

    const stats = await this.getUserStats(studentId);
    const pendingTasks = await this.prisma.task.count({
      where: {
        project: { members: { some: { userId: studentId } } },
        submissions: { none: { studentId } }
      }
    });

    return {
      ...user,
      stats: {
        ...stats,
        pendingTasks,
        attendance: "95%" // Placeholder for now
      },
      subjects: user.submissions.map(s => {
        const grade = s.grade || 0;
        let letter = 'F';
        if (grade >= 9.5) letter = 'A+';
        else if (grade >= 9) letter = 'A';
        else if (grade >= 8.5) letter = 'B+';
        else if (grade >= 8) letter = 'B';
        else if (grade >= 7.5) letter = 'C+';
        else if (grade >= 7) letter = 'C';
        else if (grade >= 6) letter = 'D';

        return {
          id: s.task.project.id,
          name: s.task.project.name,
          teacher: s.task.project.user.fullName,
          grade: s.grade,
          letter
        };
      })
    };
  }

  async getTeacherProfile(teacherId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: teacherId },
      include: {
        projects: {
          include: {
            classroom: true,
            _count: { select: { members: true } }
          }
        },
        projectMemberships: {
          where: { role: 'teacher' },
          include: {
            project: {
              include: {
                classroom: true,
                _count: { select: { members: true } }
              }
            }
          }
        }
      }
    });

    if (!user) return null;

    const allProjects = [...user.projects, ...user.projectMemberships.map(m => m.project)];
    const totalStudents = allProjects.reduce((acc, p) => acc + p._count.members, 0);

    const submissions = await this.prisma.submission.aggregate({
      where: { task: { projectId: { in: allProjects.map(p => p.id) } }, status: 'GRADED' },
      _avg: { grade: true }
    });

    return {
      ...user,
      stats: {
        totalStudents,
        totalSubjects: allProjects.length,
        avgPerformance: submissions._avg.grade || 0,
        attendance: "98%" // Placeholder
      },
      subjects: allProjects.map(p => ({
        id: p.id,
        name: p.name,
        classroom: p.classroom?.name || 'N/A',
        students: p._count.members
      }))
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

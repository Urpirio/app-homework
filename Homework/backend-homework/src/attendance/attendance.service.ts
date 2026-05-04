import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BulkAttendanceDto } from './dto/attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async bulkRecord(dto: BulkAttendanceDto) {
    const { projectId, date, records } = dto;
    const attendanceDate = new Date(date);
    // Normalize date to start of day
    attendanceDate.setHours(0, 0, 0, 0);

    const results = await Promise.all(
      records.map((record) =>
        this.prisma.attendance.upsert({
          where: {
            studentId_projectId_date: {
              studentId: record.studentId,
              projectId,
              date: attendanceDate,
            },
          },
          update: {
            status: record.status,
            note: record.note,
          },
          create: {
            studentId: record.studentId,
            projectId,
            date: attendanceDate,
            status: record.status,
            note: record.note,
          },
        }),
      ),
    );

    return { count: results.length };
  }

  async getHistoryByProject(projectId: string, startDate?: string, endDate?: string) {
    const where: any = { projectId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    return this.prisma.attendance.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  async getStudentSummary(studentId: string, projectId?: string) {
    const where: any = { studentId };
    if (projectId) where.projectId = projectId;

    const stats = await this.prisma.attendance.groupBy({
      by: ['status'],
      where,
      _count: { id: true },
    });

    const total = stats.reduce((acc, curr) => acc + curr._count.id, 0);
    const presentCount = stats.find((s) => s.status === 'PRESENT')?._count.id || 0;

    return {
      stats: stats.map((s) => ({ status: s.status, count: s._count.id })),
      total,
      percentage: total > 0 ? (presentCount / total) * 100 : 100,
    };
  }
}

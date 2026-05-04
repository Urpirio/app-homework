import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AttendanceService } from './attendance.service';
import { BulkAttendanceDto } from './dto/attendance.dto';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.TEACHER)
  async record(@Body() dto: BulkAttendanceDto) {
    return this.attendanceService.bulkRecord(dto);
  }

  @Get('project/:projectId')
  async getHistory(
    @Param('projectId') projectId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.attendanceService.getHistoryByProject(projectId, startDate, endDate);
  }

  @Get('student/:studentId')
  async getStudentSummary(
    @Param('studentId') studentId: string,
    @Query('projectId') projectId?: string,
  ) {
    return this.attendanceService.getStudentSummary(studentId, projectId);
  }
}

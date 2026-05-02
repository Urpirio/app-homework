import { Controller, Post, Body, Get, Param, UseGuards, Request, Patch } from '@nestjs/common';
import { SubmissionsService } from './submissions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('submissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post()
  @Roles(Role.STUDENT, Role.TEACHER, Role.SCHOOL_ADMIN)
  async submit(@Request() req: any, @Body() body: { taskId: string; fileUrl?: string; content?: string }) {
    return this.submissionsService.submit(req.user.userId, body);
  }

  @Patch(':id/grade')
  @Roles(Role.TEACHER, Role.SCHOOL_ADMIN)
  async grade(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { grade: number; feedback?: string },
  ) {
    return this.submissionsService.grade(req.user.userId, id, body);
  }

  @Get('task/:taskId')
  async findByTask(@Request() req: any, @Param('taskId') taskId: string) {
    return this.submissionsService.findByTask(taskId, req.user.userId);
  }
}

import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('subjects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Post('classroom/:classId')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
  create(
    @Request() req: any,
    @Param('classId') classId: string,
    @Body() data: { name: string; teacherIds: string[] }
  ) {
    return this.subjectsService.create(classId, req.user, data);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subjectsService.findOne(id);
  }

  @Get(':id/tasks')
  getTasks(@Param('id') id: string) {
    return this.subjectsService.getTasks(id);
  }

  @Get(':id/stats')
  getStats(@Param('id') id: string) {
    return this.subjectsService.getStats(id);
  }
}

import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ClassroomsService } from './classrooms.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Prisma, Role } from '@prisma/client';

@Controller('classrooms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassroomsController {
  constructor(private readonly classroomsService: ClassroomsService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
  create(@Request() req: any, @Body() data: any) {
    return this.classroomsService.create(req.user, data);
  }

  @Get('institution/:instId')
  findAll(@Param('instId') instId: string) {
    return this.classroomsService.findAllForInstitution(instId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.classroomsService.findOne(id);
  }

  @Get(':id/subjects')
  getSubjects(@Param('id') id: string) {
    return this.classroomsService.getSubjects(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
  update(@Request() req: any, @Param('id') id: string, @Body() data: any) {
    return this.classroomsService.update(id, req.user, data);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
  remove(@Request() req: any, @Param('id') id: string) {
    return this.classroomsService.remove(id, req.user);
  }

  @Post(':id/students')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
  addStudent(@Param('id') id: string, @Body() body: { studentId: string }) {
    return this.classroomsService.addStudent(id, body.studentId);
  }

  @Delete(':id/students/:studentId')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
  removeStudent(@Param('id') id: string, @Param('studentId') studentId: string) {
    return this.classroomsService.removeStudent(id, studentId);
  }
}

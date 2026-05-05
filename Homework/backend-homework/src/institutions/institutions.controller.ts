import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AssignAdminDto } from './dto/assign-admin.dto';
import { EnrollStudentDto } from './dto/enroll-student.dto';
import { UpdateInstitutionDto } from './dto/update-institution.dto';
import { InstitutionsService } from './institutions.service';

@Controller('institutions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InstitutionsController {
  constructor(private readonly institutionsService: InstitutionsService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN)
  async create(@Body() body: { name: string; logoUrl?: string; address?: string }) {
    return this.institutionsService.create(body);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN)
  async findAll() {
    return this.institutionsService.findAll();
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
  async findOne(@Param('id') id: string) {
    return this.institutionsService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
  async update(@Param('id') id: string, @Body() body: UpdateInstitutionDto) {
    return this.institutionsService.update(id, body);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  async remove(@Param('id') id: string) {
    return this.institutionsService.softDelete(id);
  }

  @Post(':id/admins')
  @Roles(Role.SUPER_ADMIN)
  async assignAdmin(@Param('id') id: string, @Body() body: AssignAdminDto) {
    return this.institutionsService.assignAdmin(id, body.userId);
  }

  @Delete(':id/admins/:adminId')
  @Roles(Role.SUPER_ADMIN)
  async removeAdmin(@Param('id') id: string, @Param('adminId') adminId: string) {
    return this.institutionsService.removeAdmin(id, adminId);
  }

  @Get(':id/stats')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
  async getStats(@Param('id') id: string) {
    return this.institutionsService.getStats(id);
  }

  @Get(':id/students')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
  async getStudents(@Param('id') id: string) {
    return this.institutionsService.getStudents(id);
  }

  @Get(':id/teachers')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
  async getTeachers(@Param('id') id: string) {
    return this.institutionsService.getTeachers(id);
  }

  @Get(':id/admins')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
  async getAdmins(@Param('id') id: string) {
    return this.institutionsService.getAdmins(id);
  }

  @Get(':id/analytics')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
  async getAnalytics(@Param('id') id: string) {
    return this.institutionsService.getAnalytics(id);
  }

  @Post(':id/enroll-student')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
  async enrollStudent(
    @Param('id') id: string,
    @Body() body: EnrollStudentDto,
  ) {
    return this.institutionsService.enrollStudent(id, body);
  }
}

import { Body, Controller, Get, NotFoundException, Param, Put, Query, Request, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { NotificationPreferencesDto } from './dto/notification-preferences.dto';
import { UsersService } from './users.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('users')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('role') role?: string,
    @Query('institutionId') institutionId?: string,
    @Query('search') search?: string,
  ) {
    return this.usersService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      role,
      institutionId,
      search,
    });
  }

  @Get('students/:id/profile')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.TEACHER)
  async getStudentProfile(@Param('id') id: string) {
    const profile = await this.usersService.getStudentProfile(id);
    if (!profile) throw new NotFoundException('Estudiante no encontrado');
    return profile;
  }

  @Get('teachers/:id/profile')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
  async getTeacherProfile(@Param('id') id: string) {
    const profile = await this.usersService.getTeacherProfile(id);
    if (!profile) throw new NotFoundException('Maestro no encontrado');
    return profile;
  }

  @Get('teachers/:id/students')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.TEACHER)
  async getTeacherStudents(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('classroomId') classroomId?: string,
  ) {
    return this.usersService.getTeacherStudents(id, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      classroomId,
    });
  }

  @Get('teachers/:id/subjects')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.TEACHER)
  async getTeacherSubjects(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.usersService.getTeacherSubjects(id, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('users/:id/tickets')
  async getUserTickets(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('priority') priority?: string,
  ) {
    return this.usersService.getUserTickets(id, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
      category,
      priority,
    });
  }

  @Get('user/notification-preferences')
  async getNotificationPreferences(@Request() req: any) {
    return this.usersService.getNotificationPreferences(req.user.userId);
  }

  @Put('user/notification-preferences')
  async updateNotificationPreferences(
    @Request() req: any,
    @Body() preferences: NotificationPreferencesDto,
  ) {
    return this.usersService.updateNotificationPreferences(req.user.userId, preferences);
  }
}

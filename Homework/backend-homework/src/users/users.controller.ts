import { Controller, Get, Param, UseGuards, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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

  @Get('users/:id/tickets')
  async getUserTickets(@Param('id') id: string) {
    // This could be moved to TicketsController if preferred, 
    // but the docs mention GET /users/{id}/tickets
    // For now, let's keep it consistent with docs
  }
}

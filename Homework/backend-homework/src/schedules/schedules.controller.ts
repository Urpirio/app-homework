import { Controller, Get, Post, Body, Delete, Param, UseGuards, Request, Query } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  findAll(@Request() req: any, @Query('projectId') projectId?: string) {
    return this.schedulesService.findAll({
      userId: req.user.userId,
      institutionId: req.user.institutionId,
      projectId
    });
  }

  @Post()
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER)
  create(@Body() data: any) {
    return this.schedulesService.create(data);
  }

  @Delete(':id')
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER)
  remove(@Param('id') id: string) {
    return this.schedulesService.remove(id);
  }
}

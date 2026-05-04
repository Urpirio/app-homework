import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { TicketsService } from './tickets.service';

@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  create(@Request() req: any, @Body() data: any) {
    return this.ticketsService.create(req.user, data);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.ticketsService.findAllForUser(req.user.userId, req.user.role);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }

  @Patch(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() data: any) {
    return this.ticketsService.update(id, req.user, data);
  }

  @Patch(':id/assign')
  @Roles(Role.SUPER_ADMIN, Role.SUPPORT)
  assign(@Param('id') id: string, @Body() body: { technicianId: string }) {
    return this.ticketsService.assign(id, body.technicianId);
  }

  @Patch(':id/self-assign')
  @Roles(Role.SUPER_ADMIN, Role.SUPPORT)
  selfAssign(@Request() req: any, @Param('id') id: string) {
    return this.ticketsService.assign(id, req.user.userId);
  }
}

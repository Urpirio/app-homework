import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

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
    return this.ticketsService.findAllForUser(req.user.userId);
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
}

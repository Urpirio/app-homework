import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { InstitutionsService } from './institutions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

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

  @Get(':id/stats')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
  async getStats(@Param('id') id: string) {
    return this.institutionsService.getStats(id);
  }
}

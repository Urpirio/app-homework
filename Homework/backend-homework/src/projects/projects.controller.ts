import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Prisma } from '@prisma/client';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(@Request() req: any, @Body() createProjectDto: Omit<Prisma.ProjectCreateInput, 'user'>) {
    return this.projectsService.create(req.user.userId, createProjectDto);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.projectsService.findAllForUser(req.user.userId);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.projectsService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() updateProjectDto: Prisma.ProjectUpdateInput) {
    return this.projectsService.update(id, req.user.userId, updateProjectDto);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.projectsService.remove(id, req.user.userId);
  }

  // ====== Miembros del Proyecto ======

  @Post(':id/members')
  addMember(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { memberId: string },
  ) {
    return this.projectsService.addMember(id, req.user.userId, body.memberId);
  }

  @Get(':id/members')
  getMembers(@Request() req: any, @Param('id') id: string) {
    return this.projectsService.getMembers(id, req.user.userId);
  }

  @Delete(':id/members/:memberId')
  removeMember(
    @Request() req: any,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    return this.projectsService.removeMember(id, req.user.userId, memberId);
  }
}

import { Body, Controller, Delete, Get, Param, Post, Put, Request, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { SubjectsService } from './subjects.service';

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

  @Get('chats')
  getChats(@Request() req: any) {
    return this.subjectsService.getChats(
      req.user.userId,
      req.user.role,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subjectsService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.TEACHER, Role.SCHOOL_ADMIN, Role.SUPER_ADMIN)
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() data: UpdateSubjectDto,
  ) {
    return this.subjectsService.update(id, req.user, data);
  }

  @Delete(':id')
  @Roles(Role.SCHOOL_ADMIN, Role.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.subjectsService.remove(id);
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

import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TasksService } from './tasks.service';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@Request() req: any, @Body() createTaskDto: Prisma.TaskUncheckedCreateInput) {
    return this.tasksService.create(req.user.userId, createTaskDto);
  }

  @Get('calendar')
  getCalendarTasks(
    @Request() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.tasksService.getCalendarTasks(req.user.userId, req.user.role, {
      startDate,
      endDate,
    });
  }

  @Get('project/:projectId')
  findAllByProject(@Request() req: any, @Param('projectId') projectId: string) {
    return this.tasksService.findAllByProject(projectId, req.user.userId);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.tasksService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() updateTaskDto: Prisma.TaskUpdateInput) {
    return this.tasksService.update(id, req.user.userId, updateTaskDto);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.tasksService.remove(id, req.user.userId);
  }
}

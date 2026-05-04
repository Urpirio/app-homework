import { Controller, Get, Param, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TasksService } from './tasks.service';

@Controller('units')
@UseGuards(JwtAuthGuard)
export class UnitsController {
  constructor(private readonly tasksService: TasksService) {}

  @Get(':unitId/tasks')
  getUnitTasks(
    @Request() req: any,
    @Param('unitId') unitId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('deadlineBefore') deadlineBefore?: string,
    @Query('deadlineAfter') deadlineAfter?: string,
  ) {
    return this.tasksService.getUnitTasks(unitId, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
      deadlineBefore,
      deadlineAfter,
      userId: req.user.userId,
    });
  }
}

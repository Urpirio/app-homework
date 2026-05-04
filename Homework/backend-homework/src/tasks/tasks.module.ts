import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { UnitsController } from './units.controller';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [TasksController, UnitsController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}

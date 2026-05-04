import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CollaboratorsModule } from './collaborators/collaborators.module';
import { MessagesModule } from './messages/messages.module';
import { UploadsModule } from './uploads/uploads.module';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { EmailModule } from './email/email.module';
import { InstitutionsModule } from './institutions/institutions.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { LibraryModule } from './library/library.module';
import { SchedulesModule } from './schedules/schedules.module';
import { ClassroomsModule } from './classrooms/classrooms.module';
import { SubjectsModule } from './subjects/subjects.module';
import { TicketsModule } from './tickets/tickets.module';
import { ReviewsModule } from './reviews/reviews.module';
import { AttendanceModule } from './attendance/attendance.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    PrismaModule, 
    UsersModule, 
    AuthModule, 
    ProjectsModule, 
    TasksModule, 
    NotificationsModule,
    CollaboratorsModule,
    MessagesModule,
    UploadsModule,
    EmailModule,
    InstitutionsModule,
    SubmissionsModule,
    LibraryModule,
    SchedulesModule,
    ClassroomsModule,
    SubjectsModule,
    TicketsModule,
    ReviewsModule,
    AttendanceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

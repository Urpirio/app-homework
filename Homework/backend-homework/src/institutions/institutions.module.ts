import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { InstitutionsService } from './institutions.service';
import { InstitutionsController } from './institutions.controller';

@Module({
  imports: [PrismaModule, UsersModule],
  providers: [InstitutionsService],
  controllers: [InstitutionsController],
  exports: [InstitutionsService],
})
export class InstitutionsModule {}

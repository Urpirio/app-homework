import { UsersModule } from '../users/users.module';

@Module({
  imports: [PrismaModule, UsersModule],
  providers: [InstitutionsService],
  controllers: [InstitutionsController],
  exports: [InstitutionsService],
})
export class InstitutionsModule {}

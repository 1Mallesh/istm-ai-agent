import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OffboardingController } from './offboarding.controller';
import { OffboardingService } from './offboarding.service';
import { UserModule } from '../user/user.module';
import { User, UserSchema } from '../../database/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    UserModule,
  ],
  controllers: [OffboardingController],
  providers: [OffboardingService],
  exports: [OffboardingService],
})
export class OffboardingModule {}

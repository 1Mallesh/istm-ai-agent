import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminConfigController } from './admin-config.controller';
import { AdminConfigService } from './admin-config.service';
import { Role, RoleSchema } from '../../database/schemas/role.schema';
import { Integration, IntegrationSchema } from '../../database/schemas/integration.schema';
import { ProvisioningModule } from '../provisioning/provisioning.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Role.name, schema: RoleSchema },
      { name: Integration.name, schema: IntegrationSchema },
    ]),
    ProvisioningModule,
  ],
  controllers: [AdminConfigController],
  providers: [AdminConfigService],
})
export class AdminConfigModule {}

import { Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProvisioningService } from './provisioning.service';
import { ProvisioningController } from './provisioning.controller';
import { RoleToolMappingService } from './role-tool-mapping.service';
import { ProvisioningConsumer } from './provisioning.consumer';
import { UserModule } from '../user/user.module';
import { IntegrationModule } from '../integration/integration.module';
import {
  ProvisioningLog,
  ProvisioningLogSchema,
} from '../../database/schemas/provisioning-log.schema';
import { Role, RoleSchema } from '../../database/schemas/role.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProvisioningLog.name, schema: ProvisioningLogSchema },
      { name: Role.name, schema: RoleSchema },
    ]),
    UserModule,
    IntegrationModule,
  ],
  controllers: [ProvisioningController],
  providers: [ProvisioningService, RoleToolMappingService, ProvisioningConsumer],
  exports: [ProvisioningService, RoleToolMappingService],
})
export class ProvisioningModule implements OnModuleInit {
  constructor(private readonly provisioningConsumer: ProvisioningConsumer) {}

  async onModuleInit() {
    await this.provisioningConsumer.startListening();
  }
}

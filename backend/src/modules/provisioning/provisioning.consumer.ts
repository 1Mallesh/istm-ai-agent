import { Injectable, Logger } from '@nestjs/common';
import { KafkaService } from '../../kafka/kafka.service';
import { KAFKA_TOPICS } from '../../kafka/kafka.constants';
import { ProvisioningService } from './provisioning.service';

@Injectable()
export class ProvisioningConsumer {
  private readonly logger = new Logger(ProvisioningConsumer.name);

  constructor(
    private readonly kafkaService: KafkaService,
    private readonly provisioningService: ProvisioningService,
  ) {}

  async startListening() {
    await this.kafkaService.subscribe(
      'itsm-provisioning-group',
      [
        KAFKA_TOPICS.EMPLOYEE_CREATED,
        KAFKA_TOPICS.EMPLOYEE_DELETED,
        KAFKA_TOPICS.EMPLOYEE_ROLE_UPDATED,
      ],
      async (topic, payload) => {
        this.logger.log(`Received event [${topic}]: ${JSON.stringify(payload)}`);

        switch (topic) {
          case KAFKA_TOPICS.EMPLOYEE_CREATED:
            await this.provisioningService.provisionEmployee(payload);
            break;

          case KAFKA_TOPICS.EMPLOYEE_DELETED:
            await this.provisioningService.deprovisionEmployee(payload);
            break;

          case KAFKA_TOPICS.EMPLOYEE_ROLE_UPDATED:
            await this.handleRoleUpdate(payload);
            break;

          default:
            this.logger.warn(`Unhandled topic: ${topic}`);
        }
      },
    );
  }

  private async handleRoleUpdate(payload: any) {
    this.logger.log(`Role updated for ${payload.email}: ${payload.oldRole} → ${payload.newRole}`);
    // Deprovision old role tools, provision new role tools
    if (payload.provisionedServices?.length > 0) {
      await this.provisioningService.deprovisionEmployee({
        ...payload,
        role: payload.oldRole,
        provisionedServices: payload.provisionedServices,
      });
    }
    await this.provisioningService.provisionEmployee({
      ...payload,
      role: payload.newRole,
    });
  }
}

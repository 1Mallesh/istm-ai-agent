import { Injectable, Logger } from '@nestjs/common';
import { KafkaService } from '../../kafka/kafka.service';
import { KAFKA_TOPICS } from '../../kafka/kafka.constants';
import { UserService } from '../user/user.service';

@Injectable()
export class OffboardingService {
  private readonly logger = new Logger(OffboardingService.name);

  constructor(
    private readonly userService: UserService,
    private readonly kafkaService: KafkaService,
  ) {}

  async offboardEmployee(userId: string, reason?: string) {
    this.logger.log(`Starting offboarding for user ${userId}`);

    const user = await this.userService.findById(userId);

    await this.kafkaService.publish(
      KAFKA_TOPICS.EMPLOYEE_DELETED,
      {
        userId: user._id.toString(),
        email: user.email,
        companyEmail: user.companyEmail,
        role: user.role,
        provisionedServices: user.provisionedServices,
        externalIds: user.externalIds,
        reason: reason || 'Employee offboarded',
        offboardedAt: new Date().toISOString(),
      },
      user._id.toString(),
    );

    await this.userService.softDelete(userId);

    this.logger.log(`Offboarding initiated for ${user.email} — deprovisioning event published`);
    return {
      message: 'Offboarding initiated successfully',
      userId,
      email: user.email,
      servicesToRevoke: user.provisionedServices,
    };
  }

  async getOffboardingChecklist(userId: string) {
    const user = await this.userService.findById(userId);
    return {
      userId: user._id,
      email: user.email,
      provisionedServices: user.provisionedServices,
      checklist: user.provisionedServices.map((service) => ({
        service,
        status: 'pending',
        externalId: user.externalIds?.[service] || null,
      })),
    };
  }
}

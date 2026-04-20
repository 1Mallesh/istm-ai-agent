import { Injectable, Logger } from '@nestjs/common';
import { KafkaService } from '../../kafka/kafka.service';
import { KAFKA_TOPICS } from '../../kafka/kafka.constants';
import { UserService } from '../user/user.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UserStatus } from '../../database/schemas/user.schema';

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(
    private readonly userService: UserService,
    private readonly kafkaService: KafkaService,
  ) {}

  async onboardEmployee(createUserDto: CreateUserDto) {
    this.logger.log(`Starting onboarding for ${createUserDto.email}`);

    const user = await this.userService.create(createUserDto);

    await this.kafkaService.publish(
      KAFKA_TOPICS.EMPLOYEE_CREATED,
      {
        userId: user._id.toString(),
        email: user.email,
        companyEmail: user.companyEmail,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        department: user.department,
        jobTitle: user.jobTitle,
        startDate: user.startDate,
      },
      user._id.toString(),
    );

    this.logger.log(`Onboarding initiated for ${user.email} — provisioning event published`);
    return {
      message: 'Onboarding initiated successfully',
      user: {
        id: user._id,
        email: user.email,
        companyEmail: user.companyEmail,
        status: user.status,
      },
    };
  }

  async handleBlazeWebhook(event: string, employeeId: string, payload: any) {
    this.logger.log(`Blazey webhook received: ${event} for employee ${employeeId}`);

    if (event === 'employee.onboarded') {
      return this.onboardEmployee(payload);
    }

    return { message: `Event ${event} received` };
  }

  async getOnboardingStatus(userId: string) {
    const user = await this.userService.findById(userId);
    return {
      userId: user._id,
      status: user.status,
      provisionedServices: user.provisionedServices,
      externalIds: user.externalIds,
    };
  }
}

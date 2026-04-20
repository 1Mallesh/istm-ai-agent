import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ProvisioningLog,
  ProvisioningLogDocument,
  ProvisioningAction,
  ProvisioningStatus,
} from '../../database/schemas/provisioning-log.schema';
import { RoleToolMappingService } from './role-tool-mapping.service';
import { IntegrationService } from '../integration/integration.service';
import { UserService } from '../user/user.service';
import { KafkaService } from '../../kafka/kafka.service';
import { KAFKA_TOPICS } from '../../kafka/kafka.constants';

interface EmployeeEvent {
  userId: string;
  email: string;
  companyEmail: string;
  firstName: string;
  lastName: string;
  role: string;
  department: string;
  jobTitle?: string;
  provisionedServices?: string[];
  externalIds?: Record<string, string>;
}

@Injectable()
export class ProvisioningService {
  private readonly logger = new Logger(ProvisioningService.name);

  constructor(
    @InjectModel(ProvisioningLog.name)
    private provisioningLogModel: Model<ProvisioningLogDocument>,
    private readonly roleToolMappingService: RoleToolMappingService,
    private readonly integrationService: IntegrationService,
    private readonly userService: UserService,
    private readonly kafkaService: KafkaService,
  ) {}

  async provisionEmployee(event: EmployeeEvent): Promise<void> {
    this.logger.log(`Provisioning employee: ${event.email} (role: ${event.role})`);

    const tools = await this.roleToolMappingService.getToolsForRole(event.role);
    this.logger.log(`Tools to provision for ${event.email}: ${tools.join(', ')}`);

    await this.kafkaService.publish(KAFKA_TOPICS.PROVISIONING_STARTED, {
      userId: event.userId,
      tools,
    });

    const results = await Promise.allSettled(
      tools.map((tool) => this.provisionSingleTool(event, tool)),
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    await this.kafkaService.publish(KAFKA_TOPICS.PROVISIONING_COMPLETED, {
      userId: event.userId,
      email: event.email,
      total: tools.length,
      succeeded,
      failed,
    });

    this.logger.log(
      `Provisioning completed for ${event.email}: ${succeeded}/${tools.length} succeeded`,
    );
  }

  private async provisionSingleTool(event: EmployeeEvent, tool: string): Promise<void> {
    const log = new this.provisioningLogModel({
      userId: event.userId,
      userEmail: event.email,
      role: event.role,
      action: ProvisioningAction.PROVISION,
      status: ProvisioningStatus.IN_PROGRESS,
      provider: tool,
      requestPayload: event,
    });
    await log.save();

    try {
      const result = await this.integrationService.createAccount(tool, {
        userId: event.userId,
        email: event.companyEmail || event.email,
        firstName: event.firstName,
        lastName: event.lastName,
        role: event.role,
        department: event.department,
        jobTitle: event.jobTitle,
      });

      log.status = ProvisioningStatus.SUCCESS;
      log.externalId = result?.id || result?.userId || result?.accountId;
      log.responsePayload = result;
      log.completedAt = new Date();
      await log.save();

      await this.userService.addProvisionedService(event.userId, tool, log.externalId);
      this.logger.log(`✅ Provisioned ${tool} for ${event.email}`);
    } catch (error) {
      log.status = ProvisioningStatus.FAILED;
      log.errorMessage = error.message;
      log.completedAt = new Date();
      await log.save();
      this.logger.error(`❌ Failed to provision ${tool} for ${event.email}: ${error.message}`);
      throw error;
    }
  }

  async deprovisionEmployee(event: EmployeeEvent): Promise<void> {
    this.logger.log(`Deprovisioning employee: ${event.email}`);

    const servicesToRevoke = event.provisionedServices || [];

    await Promise.allSettled(
      servicesToRevoke.map((tool) =>
        this.deprovisionSingleTool(event, tool, event.externalIds?.[tool]),
      ),
    );

    this.logger.log(`Deprovisioning completed for ${event.email}`);
  }

  private async deprovisionSingleTool(
    event: EmployeeEvent,
    tool: string,
    externalId?: string,
  ): Promise<void> {
    const log = new this.provisioningLogModel({
      userId: event.userId,
      userEmail: event.email,
      role: event.role,
      action: ProvisioningAction.DEPROVISION,
      status: ProvisioningStatus.IN_PROGRESS,
      provider: tool,
    });
    await log.save();

    try {
      await this.integrationService.deleteAccount(tool, externalId || event.email);

      log.status = ProvisioningStatus.SUCCESS;
      log.completedAt = new Date();
      await log.save();

      await this.userService.removeProvisionedService(event.userId, tool);
      this.logger.log(`✅ Deprovisioned ${tool} for ${event.email}`);
    } catch (error) {
      log.status = ProvisioningStatus.FAILED;
      log.errorMessage = error.message;
      log.completedAt = new Date();
      await log.save();
      this.logger.error(`❌ Failed to deprovision ${tool} for ${event.email}: ${error.message}`);
    }
  }

  async getLogs(query: { userId?: string; status?: string; page?: number; limit?: number }) {
    const { userId, status, page = 1, limit = 20 } = query;
    const filter: any = {};
    if (userId) filter.userId = userId;
    if (status) filter.status = status;

    const [logs, total] = await Promise.all([
      this.provisioningLogModel
        .find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.provisioningLogModel.countDocuments(filter),
    ]);

    return { data: logs, total, page, limit };
  }

  async retryFailed(userId: string): Promise<void> {
    const user = await this.userService.findById(userId);
    const failedLogs = await this.provisioningLogModel.find({
      userId,
      status: ProvisioningStatus.FAILED,
      action: ProvisioningAction.PROVISION,
    });

    await Promise.allSettled(
      failedLogs.map((log) =>
        this.provisionSingleTool(
          {
            userId: user._id.toString(),
            email: user.email,
            companyEmail: user.companyEmail,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            department: user.department,
          },
          log.provider,
        ),
      ),
    );
  }
}

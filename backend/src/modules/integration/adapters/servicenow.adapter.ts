import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { BaseIntegrationAdapter, AccountPayload, AccountResult } from './base.adapter';

@Injectable()
export class ServiceNowAdapter extends BaseIntegrationAdapter {
  readonly provider = 'servicenow';
  private readonly logger = new Logger(ServiceNowAdapter.name);

  constructor(private readonly configService: ConfigService) {
    super();
  }

  private get auth() {
    return {
      username: this.configService.get<string>('SERVICENOW_USERNAME'),
      password: this.configService.get<string>('SERVICENOW_PASSWORD'),
    };
  }

  private get instance(): string {
    return this.configService.get<string>('SERVICENOW_INSTANCE', 'https://instance.service-now.com');
  }

  async createAccount(payload: AccountPayload): Promise<AccountResult> {
    try {
      const response = await axios.post(
        `${this.instance}/api/now/table/sys_user`,
        {
          user_name: payload.email.split('@')[0],
          email: payload.email,
          first_name: payload.firstName,
          last_name: payload.lastName,
          title: payload.jobTitle,
          department: payload.department,
          active: true,
        },
        { auth: this.auth },
      );

      const sysId = response.data.result?.sys_id;
      this.logger.log(`ServiceNow: created user ${payload.email}`);
      return { id: sysId, accountId: sysId, email: payload.email };
    } catch (error) {
      this.handleError(error, 'createAccount');
    }
  }

  async deleteAccount(identifier: string): Promise<void> {
    try {
      await axios.patch(
        `${this.instance}/api/now/table/sys_user/${identifier}`,
        { active: false },
        { auth: this.auth },
      );
      this.logger.log(`ServiceNow: deactivated user ${identifier}`);
    } catch (error) {
      this.handleError(error, 'deleteAccount');
    }
  }

  async updateAccount(identifier: string, payload: Partial<AccountPayload>): Promise<AccountResult> {
    try {
      await axios.patch(
        `${this.instance}/api/now/table/sys_user/${identifier}`,
        {
          first_name: payload.firstName,
          last_name: payload.lastName,
          title: payload.jobTitle,
          department: payload.department,
        },
        { auth: this.auth },
      );
      return { id: identifier };
    } catch (error) {
      this.handleError(error, 'updateAccount');
    }
  }

  async createTicket(payload: {
    title: string;
    description: string;
    priority: string;
    category: string;
  }): Promise<{ ticketId: string; number: string }> {
    try {
      const priorityMap: Record<string, number> = {
        critical: 1, high: 2, medium: 3, low: 4,
      };

      const response = await axios.post(
        `${this.instance}/api/now/table/incident`,
        {
          short_description: payload.title,
          description: payload.description,
          urgency: priorityMap[payload.priority] || 3,
          impact: priorityMap[payload.priority] || 3,
          category: payload.category,
        },
        { auth: this.auth },
      );

      return {
        ticketId: response.data.result?.sys_id,
        number: response.data.result?.number,
      };
    } catch (error) {
      this.handleError(error, 'createTicket');
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await axios.get(
        `${this.instance}/api/now/table/sys_user?sysparm_limit=1`,
        { auth: this.auth },
      );
      return response.status === 200;
    } catch {
      return false;
    }
  }
}

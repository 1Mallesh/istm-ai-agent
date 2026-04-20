import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { BaseIntegrationAdapter, AccountPayload, AccountResult } from './base.adapter';

@Injectable()
export class SlackAdapter extends BaseIntegrationAdapter {
  readonly provider = 'slack';
  private readonly logger = new Logger(SlackAdapter.name);
  private readonly baseUrl = 'https://slack.com/api';

  constructor(private readonly configService: ConfigService) {
    super();
  }

  private get token(): string {
    return this.configService.get<string>('SLACK_BOT_TOKEN', '');
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  async createAccount(payload: AccountPayload): Promise<AccountResult> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/users.invite`,
        {
          email: payload.email,
          real_name: `${payload.firstName} ${payload.lastName}`,
          channel_ids: await this.getDefaultChannels(payload.role),
        },
        { headers: this.headers },
      );

      if (!response.data.ok) {
        if (response.data.error === 'already_in_team') {
          this.logger.warn(`Slack: ${payload.email} already in team`);
          return { email: payload.email, status: 'already_exists' };
        }
        throw new Error(response.data.error);
      }

      this.logger.log(`Slack: invited ${payload.email}`);
      return {
        userId: response.data.user?.id,
        email: payload.email,
        slackUserId: response.data.user?.id,
      };
    } catch (error) {
      this.handleError(error, 'createAccount');
    }
  }

  async deleteAccount(identifier: string): Promise<void> {
    try {
      const userId = await this.getUserIdByEmail(identifier);
      if (!userId) return;

      await axios.post(
        `${this.baseUrl}/admin.users.remove`,
        { user_id: userId, team_id: this.configService.get('SLACK_WORKSPACE_ID') },
        { headers: this.headers },
      );

      this.logger.log(`Slack: removed user ${identifier}`);
    } catch (error) {
      this.handleError(error, 'deleteAccount');
    }
  }

  async updateAccount(identifier: string, payload: Partial<AccountPayload>): Promise<AccountResult> {
    try {
      const userId = await this.getUserIdByEmail(identifier);
      if (!userId) throw new Error(`User ${identifier} not found in Slack`);

      await axios.post(
        `${this.baseUrl}/users.profile.set`,
        {
          user: userId,
          profile: {
            real_name: payload.firstName && payload.lastName
              ? `${payload.firstName} ${payload.lastName}`
              : undefined,
            title: payload.jobTitle,
            department: payload.department,
          },
        },
        { headers: this.headers },
      );

      return { userId, email: identifier };
    } catch (error) {
      this.handleError(error, 'updateAccount');
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/auth.test`, {
        headers: this.headers,
      });
      return response.data.ok === true;
    } catch {
      return false;
    }
  }

  private async getUserIdByEmail(email: string): Promise<string | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/users.lookupByEmail`, {
        headers: this.headers,
        params: { email },
      });
      return response.data.ok ? response.data.user?.id : null;
    } catch {
      return null;
    }
  }

  private async getDefaultChannels(role: string): Promise<string[]> {
    const channelMap: Record<string, string[]> = {
      developer: ['general', 'engineering', 'dev-alerts'],
      hr: ['general', 'hr-team'],
      sales: ['general', 'sales-team'],
      manager: ['general', 'managers'],
    };
    return channelMap[role.toLowerCase()] || ['general'];
  }
}

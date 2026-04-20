import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { BaseIntegrationAdapter, AccountPayload, AccountResult } from './base.adapter';

@Injectable()
export class JiraAdapter extends BaseIntegrationAdapter {
  readonly provider = 'jira';
  private readonly logger = new Logger(JiraAdapter.name);

  constructor(private readonly configService: ConfigService) {
    super();
  }

  private get auth() {
    return {
      username: this.configService.get<string>('JIRA_EMAIL'),
      password: this.configService.get<string>('JIRA_API_TOKEN'),
    };
  }

  private get host(): string {
    return this.configService.get<string>('JIRA_HOST', 'https://company.atlassian.net');
  }

  async createAccount(payload: AccountPayload): Promise<AccountResult> {
    try {
      const response = await axios.post(
        `${this.host}/rest/api/3/user`,
        {
          emailAddress: payload.email,
          displayName: `${payload.firstName} ${payload.lastName}`,
          products: ['jira-software', 'jira-servicedesk'],
        },
        { auth: this.auth },
      );

      await this.addToProject(response.data.accountId, payload.role);

      this.logger.log(`Jira: created account for ${payload.email}`);
      return { id: response.data.accountId, accountId: response.data.accountId, email: payload.email };
    } catch (error) {
      this.handleError(error, 'createAccount');
    }
  }

  async deleteAccount(identifier: string): Promise<void> {
    try {
      await axios.delete(`${this.host}/rest/api/3/user?accountId=${identifier}`, {
        auth: this.auth,
      });
      this.logger.log(`Jira: deactivated account ${identifier}`);
    } catch (error) {
      this.handleError(error, 'deleteAccount');
    }
  }

  async updateAccount(identifier: string, payload: Partial<AccountPayload>): Promise<AccountResult> {
    return { id: identifier };
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.host}/rest/api/3/myself`, { auth: this.auth });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  private async addToProject(accountId: string, role: string): Promise<void> {
    const projectKey = this.getRoleProjectKey(role);
    if (!projectKey) return;

    try {
      await axios.post(
        `${this.host}/rest/api/3/project/${projectKey}/role/10002`,
        { user: [accountId] },
        { auth: this.auth },
      );
    } catch (error) {
      this.logger.warn(`Jira: could not add to project ${projectKey}: ${error.message}`);
    }
  }

  private getRoleProjectKey(role: string): string | null {
    const map: Record<string, string> = {
      developer: 'ENG',
      engineer: 'ENG',
      hr: 'HR',
      support: 'SUP',
    };
    return map[role.toLowerCase()] || null;
  }
}

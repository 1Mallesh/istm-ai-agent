import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { BaseIntegrationAdapter, AccountPayload, AccountResult } from './base.adapter';

@Injectable()
export class SalesforceAdapter extends BaseIntegrationAdapter {
  readonly provider = 'salesforce';
  private readonly logger = new Logger(SalesforceAdapter.name);
  private accessToken: string | null = null;
  private instanceUrl: string | null = null;

  constructor(private readonly configService: ConfigService) {
    super();
  }

  private async authenticate(): Promise<{ token: string; instanceUrl: string }> {
    if (this.accessToken && this.instanceUrl) {
      return { token: this.accessToken, instanceUrl: this.instanceUrl };
    }

    const loginUrl = this.configService.get<string>('SALESFORCE_LOGIN_URL', 'https://login.salesforce.com');
    const { data } = await axios.post(`${loginUrl}/services/oauth2/token`, null, {
      params: {
        grant_type: 'password',
        client_id: this.configService.get('SALESFORCE_CLIENT_ID'),
        client_secret: this.configService.get('SALESFORCE_CLIENT_SECRET'),
        username: this.configService.get('SALESFORCE_USERNAME'),
        password: `${this.configService.get('SALESFORCE_PASSWORD')}${this.configService.get('SALESFORCE_SECURITY_TOKEN')}`,
      },
    });

    this.accessToken = data.access_token;
    this.instanceUrl = data.instance_url;
    return { token: this.accessToken, instanceUrl: this.instanceUrl };
  }

  async createAccount(payload: AccountPayload): Promise<AccountResult> {
    try {
      const { token, instanceUrl } = await this.authenticate();
      const response = await axios.post(
        `${instanceUrl}/services/data/v59.0/sobjects/User`,
        {
          FirstName: payload.firstName,
          LastName: payload.lastName,
          Email: payload.email,
          Username: payload.email,
          Alias: payload.firstName.substring(0, 5).toLowerCase(),
          Title: payload.jobTitle,
          Department: payload.department,
          TimeZoneSidKey: 'America/New_York',
          LocaleSidKey: 'en_US',
          EmailEncodingKey: 'UTF-8',
          LanguageLocaleKey: 'en_US',
          ProfileId: await this.getProfileId(payload.role, token, instanceUrl),
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      this.logger.log(`Salesforce: created user ${payload.email}`);
      return { id: response.data.id, email: payload.email };
    } catch (error) {
      this.handleError(error, 'createAccount');
    }
  }

  async deleteAccount(identifier: string): Promise<void> {
    try {
      const { token, instanceUrl } = await this.authenticate();
      await axios.patch(
        `${instanceUrl}/services/data/v59.0/sobjects/User/${identifier}`,
        { IsActive: false },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      this.logger.log(`Salesforce: deactivated user ${identifier}`);
    } catch (error) {
      this.handleError(error, 'deleteAccount');
    }
  }

  async updateAccount(identifier: string, payload: Partial<AccountPayload>): Promise<AccountResult> {
    return { id: identifier };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.authenticate();
      return true;
    } catch {
      return false;
    }
  }

  private async getProfileId(role: string, token: string, instanceUrl: string): Promise<string> {
    try {
      const profileName = ['sales', 'manager'].includes(role.toLowerCase())
        ? 'Standard User'
        : 'System Administrator';

      const response = await axios.get(
        `${instanceUrl}/services/data/v59.0/query?q=SELECT+Id+FROM+Profile+WHERE+Name='${profileName}'+LIMIT+1`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      return response.data.records?.[0]?.Id;
    } catch {
      return null;
    }
  }
}

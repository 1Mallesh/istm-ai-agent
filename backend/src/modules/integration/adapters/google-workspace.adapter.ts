import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { BaseIntegrationAdapter, AccountPayload, AccountResult } from './base.adapter';

@Injectable()
export class GoogleWorkspaceAdapter extends BaseIntegrationAdapter {
  readonly provider = 'google_workspace';
  private readonly logger = new Logger(GoogleWorkspaceAdapter.name);
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(private readonly configService: ConfigService) {
    super();
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    const response = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: this.configService.get('GOOGLE_CLIENT_ID'),
      client_secret: this.configService.get('GOOGLE_CLIENT_SECRET'),
      refresh_token: this.configService.get('GOOGLE_REFRESH_TOKEN'),
      grant_type: 'refresh_token',
    });

    this.accessToken = response.data.access_token;
    this.tokenExpiry = new Date(Date.now() + response.data.expires_in * 1000);
    return this.accessToken;
  }

  async createAccount(payload: AccountPayload): Promise<AccountResult> {
    try {
      const token = await this.getAccessToken();
      const domain = this.configService.get<string>('GOOGLE_DOMAIN', 'company.com');

      const response = await axios.post(
        'https://admin.googleapis.com/admin/directory/v1/users',
        {
          primaryEmail: payload.email,
          name: { givenName: payload.firstName, familyName: payload.lastName },
          password: this.generateTempPassword(),
          changePasswordAtNextLogin: true,
          orgUnitPath: `/${payload.department}`,
          organizations: [{ title: payload.jobTitle, department: payload.department, primary: true }],
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      this.logger.log(`Google Workspace: created account for ${payload.email}`);
      return { id: response.data.id, email: response.data.primaryEmail };
    } catch (error) {
      this.handleError(error, 'createAccount');
    }
  }

  async deleteAccount(identifier: string): Promise<void> {
    try {
      const token = await this.getAccessToken();
      await axios.delete(
        `https://admin.googleapis.com/admin/directory/v1/users/${identifier}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      this.logger.log(`Google Workspace: suspended account ${identifier}`);
    } catch (error) {
      this.handleError(error, 'deleteAccount');
    }
  }

  async updateAccount(identifier: string, payload: Partial<AccountPayload>): Promise<AccountResult> {
    try {
      const token = await this.getAccessToken();
      const body: any = {};
      if (payload.firstName || payload.lastName) {
        body.name = { givenName: payload.firstName, familyName: payload.lastName };
      }
      if (payload.jobTitle) body.organizations = [{ title: payload.jobTitle, primary: true }];

      const response = await axios.put(
        `https://admin.googleapis.com/admin/directory/v1/users/${identifier}`,
        body,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      return { id: response.data.id, email: response.data.primaryEmail };
    } catch (error) {
      this.handleError(error, 'updateAccount');
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.getAccessToken();
      return true;
    } catch {
      return false;
    }
  }

  private generateTempPassword(): string {
    return `Temp@${Math.random().toString(36).slice(2, 10)}!`;
  }
}

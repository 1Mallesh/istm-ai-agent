import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { BaseIntegrationAdapter, AccountPayload, AccountResult } from './base.adapter';

@Injectable()
export class Microsoft365Adapter extends BaseIntegrationAdapter {
  readonly provider = 'microsoft_365';
  private readonly logger = new Logger(Microsoft365Adapter.name);
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(private readonly configService: ConfigService) {
    super();
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    const tenantId = this.configService.get('MS365_TENANT_ID');
    const response = await axios.post(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.configService.get('MS365_CLIENT_ID'),
        client_secret: this.configService.get('MS365_CLIENT_SECRET'),
        scope: 'https://graph.microsoft.com/.default',
      }),
    );

    this.accessToken = response.data.access_token;
    this.tokenExpiry = new Date(Date.now() + response.data.expires_in * 1000);
    return this.accessToken;
  }

  async createAccount(payload: AccountPayload): Promise<AccountResult> {
    try {
      const token = await this.getAccessToken();
      const domain = this.configService.get<string>('GOOGLE_DOMAIN', 'company.com');
      const mailNickname = `${payload.firstName.toLowerCase()}.${payload.lastName.toLowerCase()}`;

      const response = await axios.post(
        'https://graph.microsoft.com/v1.0/users',
        {
          accountEnabled: true,
          displayName: `${payload.firstName} ${payload.lastName}`,
          mailNickname,
          userPrincipalName: payload.email,
          givenName: payload.firstName,
          surname: payload.lastName,
          jobTitle: payload.jobTitle,
          department: payload.department,
          passwordProfile: {
            forceChangePasswordNextSignIn: true,
            password: this.generateTempPassword(),
          },
          usageLocation: 'US',
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      this.logger.log(`M365: created user ${payload.email}`);
      return { id: response.data.id, email: response.data.userPrincipalName };
    } catch (error) {
      this.handleError(error, 'createAccount');
    }
  }

  async deleteAccount(identifier: string): Promise<void> {
    try {
      const token = await this.getAccessToken();
      await axios.delete(`https://graph.microsoft.com/v1.0/users/${identifier}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      this.logger.log(`M365: deleted user ${identifier}`);
    } catch (error) {
      this.handleError(error, 'deleteAccount');
    }
  }

  async updateAccount(identifier: string, payload: Partial<AccountPayload>): Promise<AccountResult> {
    try {
      const token = await this.getAccessToken();
      await axios.patch(
        `https://graph.microsoft.com/v1.0/users/${identifier}`,
        {
          givenName: payload.firstName,
          surname: payload.lastName,
          jobTitle: payload.jobTitle,
          department: payload.department,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      return { id: identifier };
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
    return `M365@${Math.random().toString(36).slice(2, 10)}!`;
  }
}

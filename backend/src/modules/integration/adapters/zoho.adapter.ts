import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { BaseIntegrationAdapter, AccountPayload, AccountResult } from './base.adapter';

@Injectable()
export class ZohoAdapter extends BaseIntegrationAdapter {
  readonly provider = 'zoho';
  private readonly logger = new Logger(ZohoAdapter.name);
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(private readonly configService: ConfigService) {
    super();
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    const { data } = await axios.post('https://accounts.zoho.com/oauth/v2/token', null, {
      params: {
        grant_type: 'refresh_token',
        client_id: this.configService.get('ZOHO_CLIENT_ID'),
        client_secret: this.configService.get('ZOHO_CLIENT_SECRET'),
        refresh_token: this.configService.get('ZOHO_REFRESH_TOKEN'),
      },
    });

    this.accessToken = data.access_token;
    this.tokenExpiry = new Date(Date.now() + data.expires_in * 1000);
    return this.accessToken;
  }

  async createAccount(payload: AccountPayload): Promise<AccountResult> {
    try {
      const token = await this.getAccessToken();
      const response = await axios.post(
        'https://people.zoho.com/api/forms/P_Employee/records',
        {
          FirstName: payload.firstName,
          LastName: payload.lastName,
          EmailID: payload.email,
          Designation: payload.jobTitle,
          Department: payload.department,
          EmployeeStatus: 'Active',
        },
        { headers: { Authorization: `Zoho-oauthtoken ${token}` } },
      );

      this.logger.log(`Zoho: created employee record for ${payload.email}`);
      return { id: response.data?.response?.result?.pkId, email: payload.email };
    } catch (error) {
      this.handleError(error, 'createAccount');
    }
  }

  async deleteAccount(identifier: string): Promise<void> {
    try {
      const token = await this.getAccessToken();
      await axios.delete(
        `https://people.zoho.com/api/forms/P_Employee/records/${identifier}`,
        { headers: { Authorization: `Zoho-oauthtoken ${token}` } },
      );
      this.logger.log(`Zoho: removed employee ${identifier}`);
    } catch (error) {
      this.handleError(error, 'deleteAccount');
    }
  }

  async updateAccount(identifier: string, payload: Partial<AccountPayload>): Promise<AccountResult> {
    return { id: identifier };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.getAccessToken();
      return true;
    } catch {
      return false;
    }
  }
}

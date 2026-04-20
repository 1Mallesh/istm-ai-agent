import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { BaseIntegrationAdapter, AccountPayload, AccountResult } from './base.adapter';

@Injectable()
export class ZoomAdapter extends BaseIntegrationAdapter {
  readonly provider = 'zoom';
  private readonly logger = new Logger(ZoomAdapter.name);
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(private readonly configService: ConfigService) {
    super();
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    const { data } = await axios.post(
      'https://zoom.us/oauth/token?grant_type=account_credentials',
      null,
      {
        params: { account_id: this.configService.get('ZOOM_ACCOUNT_ID') },
        auth: {
          username: this.configService.get('ZOOM_CLIENT_ID'),
          password: this.configService.get('ZOOM_CLIENT_SECRET'),
        },
      },
    );

    this.accessToken = data.access_token;
    this.tokenExpiry = new Date(Date.now() + data.expires_in * 1000);
    return this.accessToken;
  }

  async createAccount(payload: AccountPayload): Promise<AccountResult> {
    try {
      const token = await this.getAccessToken();
      const response = await axios.post(
        'https://api.zoom.us/v2/users',
        {
          action: 'create',
          user_info: {
            email: payload.email,
            first_name: payload.firstName,
            last_name: payload.lastName,
            type: 1,
            job_title: payload.jobTitle,
            department: payload.department,
          },
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      this.logger.log(`Zoom: created user ${payload.email}`);
      return { id: response.data.id, userId: response.data.id, email: payload.email };
    } catch (error) {
      this.handleError(error, 'createAccount');
    }
  }

  async deleteAccount(identifier: string): Promise<void> {
    try {
      const token = await this.getAccessToken();
      await axios.delete(`https://api.zoom.us/v2/users/${identifier}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { action: 'delete' },
      });
      this.logger.log(`Zoom: deleted user ${identifier}`);
    } catch (error) {
      this.handleError(error, 'deleteAccount');
    }
  }

  async updateAccount(identifier: string, payload: Partial<AccountPayload>): Promise<AccountResult> {
    try {
      const token = await this.getAccessToken();
      await axios.patch(
        `https://api.zoom.us/v2/users/${identifier}`,
        {
          first_name: payload.firstName,
          last_name: payload.lastName,
          job_title: payload.jobTitle,
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
}

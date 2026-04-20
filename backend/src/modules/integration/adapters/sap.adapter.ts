import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { BaseIntegrationAdapter, AccountPayload, AccountResult } from './base.adapter';

@Injectable()
export class SapAdapter extends BaseIntegrationAdapter {
  readonly provider = 'sap';
  private readonly logger = new Logger(SapAdapter.name);

  constructor(private readonly configService: ConfigService) {
    super();
  }

  private get auth() {
    return {
      username: this.configService.get<string>('SAP_USERNAME'),
      password: this.configService.get<string>('SAP_PASSWORD'),
    };
  }

  private get host(): string {
    return this.configService.get<string>('SAP_HOST', 'https://sap-host');
  }

  async createAccount(payload: AccountPayload): Promise<AccountResult> {
    try {
      const response = await axios.post(
        `${this.host}/sap/opu/odata/sap/ZHCM_USER_SRV/UserSet`,
        {
          Firstname: payload.firstName,
          Lastname: payload.lastName,
          Email: payload.email,
          Position: payload.jobTitle,
          Department: payload.department,
          CompanyCode: this.configService.get('SAP_CLIENT', '100'),
        },
        {
          auth: this.auth,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        },
      );

      this.logger.log(`SAP: created user ${payload.email}`);
      return { id: response.data?.d?.UserId, email: payload.email };
    } catch (error) {
      this.handleError(error, 'createAccount');
    }
  }

  async deleteAccount(identifier: string): Promise<void> {
    try {
      await axios.delete(
        `${this.host}/sap/opu/odata/sap/ZHCM_USER_SRV/UserSet('${identifier}')`,
        { auth: this.auth },
      );
      this.logger.log(`SAP: deactivated user ${identifier}`);
    } catch (error) {
      this.handleError(error, 'deleteAccount');
    }
  }

  async updateAccount(identifier: string, payload: Partial<AccountPayload>): Promise<AccountResult> {
    return { id: identifier };
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await axios.get(
        `${this.host}/sap/opu/odata/sap/ZHCM_USER_SRV/`,
        { auth: this.auth },
      );
      return response.status === 200;
    } catch {
      return false;
    }
  }
}

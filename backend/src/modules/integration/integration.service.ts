import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Integration,
  IntegrationDocument,
  IntegrationProvider,
  IntegrationStatus,
} from '../../database/schemas/integration.schema';
import { BaseIntegrationAdapter, AccountPayload } from './adapters/base.adapter';
import { SlackAdapter } from './adapters/slack.adapter';
import { GitHubAdapter } from './adapters/github.adapter';
import { GoogleWorkspaceAdapter } from './adapters/google-workspace.adapter';
import { Microsoft365Adapter } from './adapters/microsoft365.adapter';
import { JiraAdapter } from './adapters/jira.adapter';
import { ZoomAdapter } from './adapters/zoom.adapter';
import { ZohoAdapter } from './adapters/zoho.adapter';
import { ServiceNowAdapter } from './adapters/servicenow.adapter';
import { SapAdapter } from './adapters/sap.adapter';
import { SalesforceAdapter } from './adapters/salesforce.adapter';

@Injectable()
export class IntegrationService {
  private readonly logger = new Logger(IntegrationService.name);
  private readonly adapterRegistry: Map<string, BaseIntegrationAdapter>;

  constructor(
    @InjectModel(Integration.name) private integrationModel: Model<IntegrationDocument>,
    private readonly slackAdapter: SlackAdapter,
    private readonly githubAdapter: GitHubAdapter,
    private readonly googleAdapter: GoogleWorkspaceAdapter,
    private readonly ms365Adapter: Microsoft365Adapter,
    private readonly jiraAdapter: JiraAdapter,
    private readonly zoomAdapter: ZoomAdapter,
    private readonly zohoAdapter: ZohoAdapter,
    private readonly serviceNowAdapter: ServiceNowAdapter,
    private readonly sapAdapter: SapAdapter,
    private readonly salesforceAdapter: SalesforceAdapter,
  ) {
    this.adapterRegistry = new Map<string, BaseIntegrationAdapter>([
      ['slack', slackAdapter],
      ['github', githubAdapter],
      ['google_workspace', googleAdapter],
      ['microsoft_365', ms365Adapter],
      ['jira', jiraAdapter],
      ['zoom', zoomAdapter],
      ['zoho', zohoAdapter],
      ['servicenow', serviceNowAdapter],
      ['sap', sapAdapter],
      ['salesforce', salesforceAdapter],
    ]);
  }

  private getAdapter(provider: string): BaseIntegrationAdapter {
    const adapter = this.adapterRegistry.get(provider.toLowerCase());
    if (!adapter) {
      throw new NotFoundException(`Integration adapter for "${provider}" not found`);
    }
    return adapter;
  }

  async createAccount(provider: string, payload: AccountPayload) {
    const integration = await this.integrationModel.findOne({
      provider: provider.toLowerCase(),
      isEnabled: true,
      status: IntegrationStatus.ACTIVE,
    });

    if (!integration) {
      this.logger.warn(`Integration ${provider} is not enabled — skipping`);
      return { status: 'skipped', reason: 'integration_not_enabled' };
    }

    return this.getAdapter(provider).createAccount(payload);
  }

  async deleteAccount(provider: string, identifier: string) {
    const adapter = this.getAdapter(provider);
    return adapter.deleteAccount(identifier);
  }

  async updateAccount(provider: string, identifier: string, payload: Partial<AccountPayload>) {
    const adapter = this.getAdapter(provider);
    return adapter.updateAccount(identifier, payload);
  }

  async testConnection(provider: string): Promise<boolean> {
    try {
      const adapter = this.getAdapter(provider);
      return adapter.testConnection();
    } catch {
      return false;
    }
  }

  async getAllIntegrations(): Promise<Integration[]> {
    return this.integrationModel.find().exec();
  }

  async upsertIntegration(
    provider: string,
    credentials: Record<string, string>,
    config?: Record<string, any>,
  ): Promise<IntegrationDocument> {
    const isConnected = await this.testConnection(provider);

    return this.integrationModel.findOneAndUpdate(
      { provider },
      {
        $set: {
          provider,
          displayName: this.getDisplayName(provider),
          credentials,
          config: config || {},
          status: isConnected ? IntegrationStatus.ACTIVE : IntegrationStatus.ERROR,
          isEnabled: true,
        },
      },
      { upsert: true, new: true },
    );
  }

  async toggleIntegration(provider: string, isEnabled: boolean): Promise<IntegrationDocument> {
    const integration = await this.integrationModel.findOneAndUpdate(
      { provider },
      { $set: { isEnabled, status: isEnabled ? IntegrationStatus.ACTIVE : IntegrationStatus.INACTIVE } },
      { new: true },
    );
    if (!integration) throw new NotFoundException(`Integration ${provider} not found`);
    return integration;
  }

  private getDisplayName(provider: string): string {
    const names: Record<string, string> = {
      slack: 'Slack',
      github: 'GitHub',
      google_workspace: 'Google Workspace',
      microsoft_365: 'Microsoft 365',
      jira: 'Jira',
      zoom: 'Zoom',
      zoho: 'Zoho',
      servicenow: 'ServiceNow',
      sap: 'SAP',
      salesforce: 'Salesforce',
    };
    return names[provider.toLowerCase()] || provider;
  }
}

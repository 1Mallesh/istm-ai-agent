import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IntegrationController } from './integration.controller';
import { IntegrationService } from './integration.service';
import { Integration, IntegrationSchema } from '../../database/schemas/integration.schema';
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

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Integration.name, schema: IntegrationSchema }]),
  ],
  controllers: [IntegrationController],
  providers: [
    IntegrationService,
    SlackAdapter,
    GitHubAdapter,
    GoogleWorkspaceAdapter,
    Microsoft365Adapter,
    JiraAdapter,
    ZoomAdapter,
    ZohoAdapter,
    ServiceNowAdapter,
    SapAdapter,
    SalesforceAdapter,
  ],
  exports: [IntegrationService],
})
export class IntegrationModule {}

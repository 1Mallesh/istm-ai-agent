import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type IntegrationDocument = Integration & Document;

export enum IntegrationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
  CONFIGURING = 'configuring',
}

export enum IntegrationProvider {
  SLACK = 'slack',
  GITHUB = 'github',
  GOOGLE_WORKSPACE = 'google_workspace',
  MICROSOFT_365 = 'microsoft_365',
  JIRA = 'jira',
  ZOOM = 'zoom',
  ZOHO = 'zoho',
  SERVICENOW = 'servicenow',
  SAP = 'sap',
  SALESFORCE = 'salesforce',
}

@Schema({ timestamps: true, collection: 'integrations' })
export class Integration {
  @Prop({ required: true, enum: IntegrationProvider, unique: true })
  provider: IntegrationProvider;

  @Prop({ required: true })
  displayName: string;

  @Prop({ enum: IntegrationStatus, default: IntegrationStatus.INACTIVE })
  status: IntegrationStatus;

  @Prop({ type: Object, default: {}, select: false })
  credentials: Record<string, string>;

  @Prop({ type: Object, default: {} })
  config: Record<string, any>;

  @Prop()
  lastSyncAt: Date;

  @Prop()
  lastErrorMessage: string;

  @Prop({ default: 0 })
  syncCount: number;

  @Prop({ default: 0 })
  errorCount: number;

  @Prop({ type: [String], default: [] })
  supportedOperations: string[];

  @Prop({ default: true })
  isEnabled: boolean;
}

export const IntegrationSchema = SchemaFactory.createForClass(Integration);

IntegrationSchema.index({ provider: 1 });
IntegrationSchema.index({ status: 1 });

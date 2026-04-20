import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProvisioningLogDocument = ProvisioningLog & Document;

export enum ProvisioningAction {
  PROVISION = 'provision',
  DEPROVISION = 'deprovision',
  UPDATE = 'update',
  RETRY = 'retry',
}

export enum ProvisioningStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  SUCCESS = 'success',
  FAILED = 'failed',
  PARTIAL = 'partial',
}

@Schema({ timestamps: true, collection: 'provisioning_logs' })
export class ProvisioningLog {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  userEmail: string;

  @Prop({ required: true })
  role: string;

  @Prop({ required: true, enum: ProvisioningAction })
  action: ProvisioningAction;

  @Prop({ required: true, enum: ProvisioningStatus, default: ProvisioningStatus.PENDING })
  status: ProvisioningStatus;

  @Prop({ required: true })
  provider: string;

  @Prop()
  externalId: string;

  @Prop()
  errorMessage: string;

  @Prop({ type: Object, default: {} })
  requestPayload: Record<string, any>;

  @Prop({ type: Object, default: {} })
  responsePayload: Record<string, any>;

  @Prop({ default: 0 })
  retryCount: number;

  @Prop()
  completedAt: Date;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const ProvisioningLogSchema = SchemaFactory.createForClass(ProvisioningLog);

ProvisioningLogSchema.index({ userId: 1 });
ProvisioningLogSchema.index({ status: 1 });
ProvisioningLogSchema.index({ provider: 1 });
ProvisioningLogSchema.index({ action: 1 });
ProvisioningLogSchema.index({ createdAt: -1 });

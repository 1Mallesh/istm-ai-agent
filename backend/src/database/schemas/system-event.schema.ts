import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SystemEventDocument = SystemEvent & Document;

export enum EventSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export enum EventType {
  SOFTWARE_BUG = 'software_bug',
  HARDWARE_FAULT = 'hardware_fault',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  CONNECTIVITY = 'connectivity',
  PROVISIONING = 'provisioning',
  AUTH = 'auth',
}

@Schema({ timestamps: true, collection: 'system_events' })
export class SystemEvent {
  @Prop({ required: true, enum: EventType })
  type: EventType;

  @Prop({ required: true, enum: EventSeverity })
  severity: EventSeverity;

  @Prop({ required: true })
  source: string;

  @Prop({ required: true })
  message: string;

  @Prop({ type: Object, default: {} })
  payload: Record<string, any>;

  @Prop({ default: false })
  ticketCreated: boolean;

  @Prop()
  ticketId: string;

  @Prop()
  resolvedAt: Date;

  @Prop({ default: false })
  isProcessed: boolean;

  @Prop()
  aiDetectedAt: Date;

  @Prop()
  aiConfidenceScore: number;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const SystemEventSchema = SchemaFactory.createForClass(SystemEvent);

SystemEventSchema.index({ type: 1 });
SystemEventSchema.index({ severity: 1 });
SystemEventSchema.index({ isProcessed: 1 });
SystemEventSchema.index({ createdAt: -1 });

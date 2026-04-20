import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SystemEventDocument = SystemEvent & Document;

@Schema({ timestamps: true, collection: 'system_events' })
export class SystemEvent {
  @Prop({ required: true }) type: string;
  @Prop({ required: true }) severity: string;
  @Prop({ required: true }) source: string;
  @Prop({ required: true }) message: string;
  @Prop({ type: Object, default: {} }) payload: Record<string, any>;
  @Prop({ default: false }) ticketCreated: boolean;
  @Prop() ticketId: string;
  @Prop({ default: false }) isProcessed: boolean;
  @Prop() aiConfidenceScore: number;
  @Prop({ type: Object, default: {} }) metadata: Record<string, any>;
}

export const SystemEventSchema = SchemaFactory.createForClass(SystemEvent);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RoleDocument = Role & Document;

@Schema({ timestamps: true, collection: 'roles' })
export class Role {
  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  name: string;

  @Prop({ required: true })
  displayName: string;

  @Prop({ trim: true })
  description: string;

  @Prop({ type: [String], default: [] })
  permissions: string[];

  @Prop({ type: [String], default: [] })
  requiredTools: string[];

  @Prop({ type: [String], default: [] })
  optionalTools: string[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isDefault: boolean;

  @Prop({ type: Object, default: {} })
  toolConfig: Record<string, Record<string, any>>;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const RoleSchema = SchemaFactory.createForClass(Role);

RoleSchema.index({ name: 1 });

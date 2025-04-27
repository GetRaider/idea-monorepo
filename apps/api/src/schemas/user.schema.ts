import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

import { IRoleModel } from '@denzel/api/src/models/index';

export type UserDocument = IUserEntity & Document;

export interface IUserEntity {
  readonly _id: string;
  readonly login: string;
  readonly password: string;
  readonly roles: Array<IRoleModel>;
  readonly name?: string;
  readonly age?: number;
}

@Schema({
  collection: 'users',
  autoCreate: true,
  versionKey: false,
  strict: false,
  timestamps: { createdAt: true, updatedAt: true },
})
export class UserEntity implements IUserEntity {
  @Prop({
    type: String,
    required: true,
    default: () => uuidv4(),
  })
  readonly _id: string;

  @Prop({ type: String, required: true })
  readonly login: string;

  @Prop({ type: String, required: true })
  readonly password: string;

  @Prop({ type: Array, required: true })
  readonly roles: Array<IRoleModel>;

  @Prop({ type: String })
  readonly name?: string;

  @Prop({ type: Number })
  readonly age?: number;
}

export const UserSchema = SchemaFactory.createForClass(UserEntity);

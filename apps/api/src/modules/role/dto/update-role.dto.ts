import {
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { IRoleModel, UserModel } from '@denzel/api/src/models/index';
import { Role } from '@denzel/api/src/constants/roles.constants';

export interface IUpdateRoleRequestDto {
  readonly value?: string;
  readonly description?: string;
}

export class UpdateRoleRequestDto implements IUpdateRoleRequestDto {
  @IsString()
  @IsOptional()
  readonly value?: Role;

  @IsNumber()
  @IsOptional()
  readonly description?: string;
}

export interface IUpdateRoleResponseDto {
  readonly role: IRoleModel;
}

export class UpdateRoleResponseDto implements IUpdateRoleResponseDto {
  @IsObject()
  @Type(() => UserModel)
  @ValidateNested()
  readonly role: IRoleModel;
}

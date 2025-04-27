import {
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { UserModel, RoleModel, IUserModel } from '@denzel/api/src/models/index';

export interface ICreateUserRequestDto {
  readonly login: string;
  readonly password: string;
  readonly name?: string;
  readonly age?: number;
}

export class CreateUserRequestDto implements ICreateUserRequestDto {
  @IsString()
  readonly login: string;

  @IsString()
  readonly password: string;

  readonly roles: Array<RoleModel>;

  @IsString()
  @IsOptional()
  readonly name?: string;

  @IsString()
  @IsOptional()
  readonly age?: number;
}

export interface ICreateUserResponseDto {
  readonly user: IUserModel;
}

export class CreateUserResponseDto implements ICreateUserResponseDto {
  @IsObject()
  @Type(() => UserModel)
  @ValidateNested()
  readonly user: IUserModel;
}

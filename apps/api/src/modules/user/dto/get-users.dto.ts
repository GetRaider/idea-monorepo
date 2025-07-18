import { IsArray, IsObject, IsOptional, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';

import {
  UserModel,
  IRoleModel,
  IUserModel,
} from '@denzel/api/src/models/index';
import { propertyHelper } from '@denzel/api/src/helpers/property.helper';

export interface IGetUsersRequestDto {
  readonly id?: Array<string>;
  readonly login?: Array<string>;
  readonly roles?: Array<IRoleModel>;
  readonly name?: Array<string>;
  readonly age?: Array<number>;
}

export class GetUsersRequestDto implements IGetUsersRequestDto {
  @Transform(propertyHelper.transformValueToArray)
  @IsOptional()
  @IsArray()
  readonly id?: Array<string>;

  @Transform(propertyHelper.transformValueToArray)
  @IsOptional()
  @IsArray()
  readonly login?: Array<string>;

  @Transform(propertyHelper.transformValueToArray)
  @IsOptional()
  @IsArray()
  readonly name?: Array<string>;

  @Transform(propertyHelper.transformValueToArray)
  @IsOptional()
  @IsArray()
  readonly age?: Array<number>;

  @IsOptional()
  @IsArray()
  readonly roles?: Array<IRoleModel>;
}

export interface IGetUsersResponseDto {
  readonly users: Array<IUserModel>;
}

export class GetUsersResponseDto implements IGetUsersResponseDto {
  @IsObject()
  @Type(() => UserModel)
  @ValidateNested()
  readonly users: Array<IUserModel>;
}

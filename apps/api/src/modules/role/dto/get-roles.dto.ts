import { IsArray, IsObject, IsOptional, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';

import { propertyHelper } from '@denzel/api/src/helpers/property.helper';
import { RoleModel, IRoleModel } from '@denzel/api/src/models/index';
import { Role } from '@denzel/api/src/constants/roles.constants';

export interface IGetRolesRequestDto {
  readonly id?: Array<string>;
  readonly value?: Array<string>;
  readonly description?: Array<string>;
}

export class GetRolesRequestDto implements IGetRolesRequestDto {
  @Transform(propertyHelper.transformValueToArray)
  @IsOptional()
  @IsArray()
  readonly id?: Array<string>;

  @Transform(propertyHelper.transformValueToArray)
  @IsOptional()
  @IsArray()
  readonly value?: Array<Role>;

  @Transform(propertyHelper.transformValueToArray)
  @IsOptional()
  @IsArray()
  readonly description?: Array<string>;
}

export interface IGetRolesResponseDto {
  readonly roles: Array<IRoleModel>;
}

export class GetRolesResponseDto implements IGetRolesResponseDto {
  @IsObject()
  @Type(() => RoleModel)
  @ValidateNested()
  readonly roles: Array<IRoleModel>;
}

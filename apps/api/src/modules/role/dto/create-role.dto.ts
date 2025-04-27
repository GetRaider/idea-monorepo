import {
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

import { RoleModel, IRoleModel } from "@denzel/api/src/models/index";
import { Role } from "@denzel/api/src/constants/roles.constants";

export interface ICreateRoleRequestDto {
  readonly value?: Role;
  readonly description?: string;
}

export class CreateRoleRequestDto implements ICreateRoleRequestDto {
  @IsString()
  readonly value?: Role;

  @IsString()
  @IsOptional()
  readonly description?: string;
}

export interface ICreateRoleResponseDto {
  readonly role: IRoleModel;
}

export class CreateRoleResponseDto implements ICreateRoleResponseDto {
  @IsObject()
  @Type(() => RoleModel)
  @ValidateNested()
  readonly role: IRoleModel;
}

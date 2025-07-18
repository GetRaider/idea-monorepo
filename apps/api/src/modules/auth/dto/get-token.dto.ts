import { IsArray, IsObject, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import {
  IRoleModel,
  AuthModel,
  IAuthModel,
} from '@denzel/api/src/models/index';

export interface IGetTokenRequestDto {
  readonly id: string;
  readonly login: string;
  readonly password: string;
}

export class GetTokenRequestDto implements IGetTokenRequestDto {
  @IsString()
  readonly id: string;
  @IsString()
  readonly login: string;
  @IsString()
  readonly password: string;
  @IsArray()
  readonly roles: Array<IRoleModel>;
}

export interface IGetTokenResponseDto {
  readonly token: IAuthModel;
}

export class GetTokenResponseDto implements IGetTokenResponseDto {
  @IsObject()
  @Type(() => AuthModel)
  @ValidateNested()
  readonly token: IAuthModel;
}

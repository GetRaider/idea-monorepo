import { IsArray, IsObject, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import {
  AuthModel,
  IAuthModel,
  IRoleModel,
} from '@denzel/api/src/models/index';
import { IGetTokenResponseDto } from '@modules/auth/dto/get-token.dto';
import { IRoleModel } from '@models/role.model';

export interface IGenerateTokenRequestDto {
  readonly id: string;
  readonly login: string;
  readonly roles: Array<IRoleModel>;
}

export class GenerateTokenRequestDto implements IGenerateTokenRequestDto {
  @IsString()
  readonly id: string;
  @IsString()
  readonly login: string;
  @IsArray()
  readonly roles: Array<IRoleModel>;
}

export interface IGenerateTokenResponseDto extends IGetTokenResponseDto {}

export class GenerateTokenResponseDto implements IGenerateTokenResponseDto {
  @IsObject()
  @Type(() => AuthModel)
  @ValidateNested()
  readonly token: IAuthModel;
}

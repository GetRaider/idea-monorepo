import { IsObject, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { UserModel, IUserModel } from '@denzel/api/src/models/index';

export interface IValidateUserRequestDto {
  readonly login: string;
  readonly password: string;
}

export class ValidateUserRequestDto implements IValidateUserRequestDto {
  @IsString()
  readonly login: string;
  @IsString()
  readonly password: string;
}

export interface IValidateUserResponseDto {
  readonly user: IUserModel;
}

export class ValidateUserResponseDto implements IValidateUserResponseDto {
  @IsObject()
  @Type(() => UserModel)
  @ValidateNested()
  readonly user: IUserModel;
}

import { IsObject, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { UserModel, IUserModel } from '@denzel/api/src/models/index';

export interface IGetUserByLoginRequestDto {
  readonly login: string;
}

export class GetUserByLoginRequestDto implements IGetUserByLoginRequestDto {
  @IsString()
  readonly login: string;
}

export interface IGetUserByLoginResponseDto {
  readonly user: IUserModel;
}

// todo: Add dto for this call
export class GetUserByLoginResponseDto implements IGetUserByLoginResponseDto {
  @IsObject()
  @Type(() => UserModel)
  @ValidateNested()
  readonly user: IUserModel;
}

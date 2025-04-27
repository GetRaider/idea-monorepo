import {
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { UserModel, IUserModel } from '@denzel/api/src/models/user.model';

export interface IUpdateUserRequestDto {
  readonly login: string;
  readonly name?: string;
  readonly age?: number;
}

export class UpdateUserRequestDto implements IUpdateUserRequestDto {
  @IsString()
  @IsNotEmpty()
  readonly login: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  readonly name?: string;

  @IsNumber()
  @IsOptional()
  readonly age?: number;
}

export interface IUpdateUserResponseDto {
  readonly user: IUserModel;
}

export class UpdateUserResponseDto implements IUpdateUserResponseDto {
  @IsObject()
  @Type(() => UserModel)
  @ValidateNested()
  readonly user: IUserModel;
}

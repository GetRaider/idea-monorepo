import { IsArray, IsOptional, IsString } from 'class-validator';
import { IRoleModel } from './role.model';

export interface IUserModel {
  readonly id: string;
  readonly login: string;
  readonly password: string;
  readonly roles: Array<IRoleModel>;
  readonly name?: string;
  readonly age?: number;
}

export class UserModel implements IUserModel {
  @IsString()
  readonly id: string;

  @IsString()
  readonly login: string;

  @IsString()
  readonly password: string;

  @IsArray()
  readonly roles: Array<IRoleModel>;

  @IsString()
  @IsOptional()
  readonly name?: string;

  @IsString()
  @IsOptional()
  readonly age?: number;
}

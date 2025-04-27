import { IsOptional, IsString } from 'class-validator';

import { Role } from '../constants/roles.constants';

export interface IRoleModel {
  readonly id: string;
  readonly value: Role;
  readonly description?: string;
}

export class RoleModel implements IRoleModel {
  @IsString()
  readonly id: string;

  @IsString()
  readonly value: Role;

  @IsString()
  @IsOptional()
  readonly description?: string;
}

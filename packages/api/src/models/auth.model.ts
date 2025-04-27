import { IsString } from 'class-validator';

export interface IAuthModel {
  readonly token: string;
}

export class AuthModel implements IAuthModel {
  @IsString()
  readonly token: string;
}

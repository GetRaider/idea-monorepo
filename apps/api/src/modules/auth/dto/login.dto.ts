import {
  IValidateUserRequestDto,
  IValidateUserResponseDto,
  ValidateUserRequestDto,
  ValidateUserResponseDto,
} from '@modules/auth/dto/validate-user.dto';

export interface ILoginArgs extends IValidateUserRequestDto {}

export class LoginRequestDto
  extends ValidateUserRequestDto
  implements ILoginArgs {}

export interface ILoginResult extends IValidateUserResponseDto {}

export class LoginResponseDto
  extends ValidateUserResponseDto
  implements ILoginResult {}

import {
  CreateUserRequestDto,
  ICreateUserRequestDto,
} from "@modules/user/dto/create-user.dto";
import {
  GetTokenResponseDto,
  IGetTokenResponseDto,
} from "@modules/auth/dto/get-token.dto";

export interface IRegistrationRequestDto extends ICreateUserRequestDto {}

export class RegistrationRequestDto
  extends CreateUserRequestDto
  implements IRegistrationRequestDto {}

export interface IRegistrationResponseDto extends IGetTokenResponseDto {}

export class RegistrationResponseDto
  extends GetTokenResponseDto
  implements IRegistrationResponseDto {}

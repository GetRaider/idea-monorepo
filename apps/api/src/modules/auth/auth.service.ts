import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '@modules/user/user.service';
import * as bcryptjs from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

import {
  GetTokenRequestDto,
  GetTokenResponseDto,
} from '@modules/auth/dto/get-token.dto';
import {
  ValidateUserRequestDto,
  ValidateUserResponseDto,
} from '@modules/auth/dto/validate-user.dto';
import {
  GenerateTokenRequestDto,
  GenerateTokenResponseDto,
} from '@modules/auth/dto/generate-token.dto';
import {
  RegistrationRequestDto,
  RegistrationResponseDto,
} from '@modules/auth/dto/registration.dto';
import { plainToInstance } from 'class-transformer';
import { LoginRequestDto, LoginResponseDto } from '@modules/auth/dto/login.dto';
import { AuthModel, UserModel } from '@denzel/api/src/models/index';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async registration(
    dto: RegistrationRequestDto,
  ): Promise<RegistrationResponseDto> {
    const { login, password } = dto;
    const foundDocument = await this.userService.getOneByLogin({ login });

    if (foundDocument.user) {
      throw new HttpException(
        `User with ${login} login already exist`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const { user } = await this.userService.create({
      ...dto,
      password,
    });

    return this.generateToken(user);
  }

  async login(dto: LoginRequestDto): Promise<LoginResponseDto> {
    return this.validateUser(dto);
  }

  async getToken(dto: GetTokenRequestDto): Promise<GetTokenResponseDto> {
    return (await this.validateUser(dto)) && this.generateToken(dto);
  }

  private async generateToken(
    dto: GenerateTokenRequestDto,
  ): Promise<GenerateTokenResponseDto> {
    const { id, login, roles } = dto;
    const token = this.jwtService.sign({ login, id, roles });

    return {
      token: plainToInstance(AuthModel, token),
    };
  }

  private async validateUser(
    dto: ValidateUserRequestDto,
  ): Promise<ValidateUserResponseDto> {
    const { login, password } = dto;
    const { user } = await this.userService.getOneByLogin({ login });
    const isPasswordEqual = await bcryptjs.compare(
      password,
      user?.password || '',
    );

    if (!user || !isPasswordEqual) {
      throw new UnauthorizedException({
        message: 'Incorrect login or password',
      });
    }

    return {
      user: plainToInstance(UserModel, user),
    };
  }
}

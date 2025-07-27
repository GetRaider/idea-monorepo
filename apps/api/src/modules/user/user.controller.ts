import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import { UserService } from '@modules/user/user.service';
import {
  CreateUserRequestDto,
  CreateUserResponseDto,
} from '@modules/user/dto/create-user.dto';
import {
  GetUsersRequestDto,
  GetUsersResponseDto,
} from '@modules/user/dto/get-users.dto';
import {
  UpdateUserRequestDto,
  UpdateUserResponseDto,
} from '@modules/user/dto/update-user.dto';
import { UserEntity } from '@entities/user.entity';

@Controller('/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  // To create user without credentials during testing
  // @UseGuards(AuthGuard)
  async create(@Body() dto: CreateUserRequestDto): Promise<UserEntity> {
    return this.userService.create(dto);
  }

  @Get()
  async getAll(): Promise<UserEntity[]> {
    return this.userService.getAll();
  }

  // @Put(':id')
  // @UseGuards(AuthGuard)
  // async update(
  //   @Param('id') id: string,
  //   @Body() dto: UpdateUserRequestDto,
  // ): Promise<UpdateUserResponseDto> {
  //   return this.userService.updateById(id, dto);
  // }

  // @Delete(':id')
  // @UseGuards(AuthGuard)
  // @HttpCode(HttpStatus.NO_CONTENT)
  // async delete(@Param('id') id: string): Promise<void> {
  //   return this.userService.deleteById(id);
  // }

  // @Delete()
  // async deleteAll(): Promise<void> {
  //   return this.userService.deleteAll();
  // }
}

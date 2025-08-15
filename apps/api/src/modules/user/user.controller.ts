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
import { AuthGuard, Session, UserSession } from '@thallesp/nestjs-better-auth';
import { SelectUser } from '../../db/schema';

@Controller('/users')
// @UseGuards(AuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  // To create user without credentials during testing
  // @UseGuards(AuthGuard)
  async create(@Body() dto: SelectUser): Promise<SelectUser> {
    console.log('Controllerdto', dto);
    return this.userService.create(dto);
  }

  @Get()
  async getAll(): Promise<SelectUser[]> {
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

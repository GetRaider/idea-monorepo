import { Body, Controller, Get, Post } from '@nestjs/common';

import { UserService } from './user.service';
import { SelectUser } from '../../db/schema';

@Controller('/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/hello')
  async hello(): Promise<string> {
    return 'Hello Denzels!';
  }

  @Post()
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

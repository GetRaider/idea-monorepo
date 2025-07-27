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
} from '@nestjs/common';

import { RoleService } from '@modules/role/role.service';
import {
  CreateRoleRequestDto,
  CreateRoleResponseDto,
} from '@modules/role/dto/create-role.dto';
import {
  GetRolesRequestDto,
  GetRolesResponseDto,
} from '@modules/role/dto/get-roles.dto';
import {
  UpdateRoleRequestDto,
  UpdateRoleResponseDto,
} from '@modules/role/dto/update-role.dto';

@Controller('/roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  async create(
    @Body() dto: CreateRoleRequestDto,
  ): Promise<CreateRoleResponseDto> {
    return this.roleService.create(dto);
  }

  @Get()
  async getByQuery(
    @Query() query: GetRolesRequestDto,
  ): Promise<GetRolesResponseDto> {
    return this.roleService.getByQuery(query);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRoleRequestDto,
  ): Promise<UpdateRoleResponseDto> {
    return this.roleService.updateById(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    return this.roleService.deleteById(id);
  }
}

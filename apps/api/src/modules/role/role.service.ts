import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { plainToInstance } from 'class-transformer';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';

import { IRoleEntity, RoleDocument, RoleEntity } from '@schemas/role.schema';
import {
  CreateRoleRequestDto,
  CreateRoleResponseDto,
} from '@modules/role/dto/create-role.dto';
import { RoleModel, IRoleModel } from '@denzel/api/src/models/index';
import {
  GetRolesRequestDto,
  GetRolesResponseDto,
} from '@modules/role/dto/get-roles.dto';
import {
  UpdateRoleRequestDto,
  UpdateRoleResponseDto,
} from '@modules/role/dto/update-role.dto';

@Injectable()
export class RoleService {
  constructor(
    @InjectModel(RoleEntity.name)
    private readonly roleModel: Model<RoleDocument>,
    private readonly logger: Logger,
  ) {}

  async create(dto: CreateRoleRequestDto): Promise<CreateRoleResponseDto> {
    const { value, description } = dto;
    const newRole = new this.roleModel<IRoleEntity>({
      _id: randomUUID(),
      value,
      description,
    });
    const savedRole = await newRole.save();
    this.logger.warn(`Following role has been saved: ${savedRole}`);
    return { role: plainToInstance(RoleModel, savedRole.toJSON<IRoleModel>()) };
  }

  async getByQuery(
    query: GetRolesRequestDto = {},
  ): Promise<GetRolesResponseDto> {
    const { id: idArr, value: valueArr, description: descriptionArr } = query;
    const filterQuery: FilterQuery<IRoleModel> = {
      ...(idArr ? { _id: { $in: idArr } } : {}),
      ...(valueArr ? { value: { $in: valueArr } } : {}),
      ...(descriptionArr ? { description: { $in: descriptionArr } } : {}),
    };
    const foundRoles = await this.roleModel.find(filterQuery);

    return {
      roles: foundRoles.map((foundRole) =>
        plainToInstance(RoleModel, foundRole.toJSON<IRoleModel>()),
      ),
    };
  }

  async updateById(
    id: string,
    dto: UpdateRoleRequestDto,
  ): Promise<UpdateRoleResponseDto> {
    const updatedRole = await this.roleModel.findByIdAndUpdate(id, dto, {
      new: true,
    });

    return {
      role: plainToInstance(RoleModel, updatedRole.toJSON<IRoleModel>()),
    };
  }

  async deleteById(id: string): Promise<void> {
    await this.roleModel.findByIdAndDelete(id);
  }
}

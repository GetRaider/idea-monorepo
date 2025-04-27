import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { FilterQuery, Model } from 'mongoose';
import { randomUUID } from 'crypto';
import { plainToInstance } from 'class-transformer';
import { InjectModel } from '@nestjs/mongoose';
import bcryptjs from 'bcryptjs';

import { IUserEntity, UserDocument, UserEntity } from '@schemas/user.schema';
import { UserModel, IUserModel } from '@denzel/api/src/models/index';
import {
  GetUsersRequestDto,
  GetUsersResponseDto,
} from '@modules/user/dto/get-users.dto';
import {
  CreateUserRequestDto,
  CreateUserResponseDto,
} from '@modules/user/dto/create-user.dto';
import {
  UpdateUserRequestDto,
  UpdateUserResponseDto,
} from '@modules/user/dto/update-user.dto';
import {
  GetUserByLoginRequestDto,
  GetUserByLoginResponseDto,
} from '@modules/user/dto/get-user-by-login.dto';
import { RoleService } from '@modules/role/role.service';
import { processEnv } from '@helpers/processEnv.helper';
import { rolesIds } from '@denzel/api/src/constants/roles.constants';

const { IS_LOCAL } = processEnv;

@Injectable()
export class UserService {
  constructor(
    @InjectModel(UserEntity.name)
    private readonly userModel: Model<UserDocument>,
    private readonly logger: Logger,
    private readonly roleService: RoleService,
  ) {}

  async create(dto: CreateUserRequestDto): Promise<CreateUserResponseDto> {
    const foundRolesDocument = await this.roleService.getByQuery({
      id: [IS_LOCAL === 'true' ? rolesIds.localDefault : rolesIds.devDefault],
    });
    const {
      login,
      password,
      roles = foundRolesDocument.roles,
      name,
      age,
    } = dto;
    const encryptedPassword = await bcryptjs.hash(password, 5);
    const foundDocument = await this.getOneByLogin({ login });

    if (foundDocument.user) {
      throw new HttpException(
        `User with ${login} login already exist`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const newDocument = new this.userModel<IUserEntity>({
      _id: randomUUID(),
      login,
      password: encryptedPassword,
      roles,
      name,
      age,
    });

    const savedDocument = await newDocument.save();

    this.logger.warn(`Following user has been saved: ${savedDocument}`);
    return {
      user: plainToInstance(UserModel, savedDocument.toJSON<IUserModel>()),
    };
  }

  async getByQuery(
    query: GetUsersRequestDto = {},
  ): Promise<GetUsersResponseDto> {
    const {
      id: idArr,
      login: loginArr,
      name: nameArr,
      age: ageArr,
      roles: rolesArr,
    } = query;

    const filterQuery: FilterQuery<IUserEntity> = {
      ...(idArr ? { _id: { $in: idArr } } : {}),
      ...(loginArr ? { login: { $in: loginArr } } : {}),
      ...(nameArr ? { name: { $in: nameArr } } : {}),
      ...(ageArr ? { age: { $in: ageArr } } : {}),
      ...(rolesArr ? { roles: { $in: rolesArr } } : {}),
    };

    const foundDocuments = await this.userModel.find(filterQuery);
    return {
      users: foundDocuments.map((foundDocument) =>
        plainToInstance(UserModel, foundDocument.toJSON<IUserModel>()),
      ),
    };
  }

  async getOneByLogin(
    dto: GetUserByLoginRequestDto,
  ): Promise<GetUserByLoginResponseDto> {
    const { login } = dto;
    const foundDocument = await this.userModel.findOne({ login });

    return {
      user: plainToInstance(UserModel, foundDocument?.toJSON<IUserModel>()),
    };
  }

  async updateById(
    id: string,
    dto: UpdateUserRequestDto,
  ): Promise<UpdateUserResponseDto> {
    const updatedUser = await this.userModel.findByIdAndUpdate(id, dto, {
      new: true,
    });

    return {
      user: plainToInstance(UserModel, updatedUser.toJSON<IUserModel>()),
    };
  }

  async deleteById(id: string): Promise<void> {
    await this.userModel.findByIdAndDelete(id);
  }

  async deleteAll(): Promise<void> {
    await this.userModel.deleteMany({ login: { $gte: '@gmail' } });
  }
}

import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserEntity } from '@entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity) private userRepo: Repository<UserEntity>,
    private readonly log: Logger,
  ) {}

  async create(dto: Partial<UserEntity>): Promise<UserEntity> {
    if (await this.getOneByGithubId(dto?.githubId)) {
      const errorMessage = `User with githubId ${dto?.githubId} already exists`;
      this.log.error(errorMessage);
      throw new HttpException(errorMessage, HttpStatus.BAD_REQUEST);
    }

    return this.userRepo.save(dto);
  }

  async getAll(): Promise<UserEntity[]> {
    return this.userRepo.find();
  }

  async getOneByGithubId(githubId: string): Promise<UserEntity | null> {
    return this.userRepo.findOneBy({ githubId });
  }

  // async getByQuery(
  //   query: GetUsersRequestDto = {},
  // ): Promise<GetUsersResponseDto> {
  //   const {
  //     id: idArr,
  //     login: loginArr,
  //     name: nameArr,
  //     age: ageArr,
  //     roles: rolesArr,
  //   } = query;

  //   const filterQuery: FilterQuery<IUserEntity> = {
  //     ...(idArr ? { _id: { $in: idArr } } : {}),
  //     ...(loginArr ? { login: { $in: loginArr } } : {}),
  //     ...(nameArr ? { name: { $in: nameArr } } : {}),
  //     ...(ageArr ? { age: { $in: ageArr } } : {}),
  //     ...(rolesArr ? { roles: { $in: rolesArr } } : {}),
  //   };

  //   const foundDocuments = await this.userModel.find(filterQuery);
  //   return {
  //     users: foundDocuments.map((foundDocument) =>
  //       plainToInstance(UserModel, foundDocument.toJSON<IUserModel>()),
  //     ),
  //   };
  // }

  // async getOneByLogin(
  //   dto: GetUserByLoginRequestDto,
  // ): Promise<GetUserByLoginResponseDto> {
  //   const { login } = dto;
  //   const foundDocument = await this.userModel.findOne({ login });

  //   return {
  //     user: plainToInstance(UserModel, foundDocument?.toJSON<IUserModel>()),
  //   };
  // }

  // async updateById(
  //   id: string,
  //   dto: UpdateUserRequestDto,
  // ): Promise<UpdateUserResponseDto> {
  //   const updatedUser = await this.userModel.findByIdAndUpdate(id, dto, {
  //     new: true,
  //   });

  //   return {
  //     user: plainToInstance(UserModel, updatedUser.toJSON<IUserModel>()),
  //   };
  // }

  // async deleteById(id: string): Promise<void> {
  //   await this.userModel.findByIdAndDelete(id);
  // }

  // async deleteAll(): Promise<void> {
  //   await this.userModel.deleteMany({ login: { $gte: '@gmail' } });
  // }
}

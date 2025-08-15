import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { InsertUser, SelectUser } from '../../db/schema';
import { users } from '../../../auth-schema';

@Injectable()
export class UserService {
  constructor(private readonly log: Logger) {}

  async create(dto: Partial<SelectUser>): Promise<SelectUser> {
    if (!dto || Object.keys(dto).length === 0) {
      throw new HttpException('Request body is empty', HttpStatus.BAD_REQUEST);
    }
    const now = new Date();
    const insert: any = {
      id: dto.id ?? crypto.randomUUID?.() ?? undefined,
      name: dto.name ?? 'User',
      email: dto.email ?? `user_${Date.now()}@example.com`,
      emailVerified: dto.emailVerified ?? false,
      image: dto.image ?? null,
      createdAt: dto.createdAt ?? now,
      updatedAt: dto.updatedAt ?? now,
    };

    try {
      const [created] = await db
        .insert(users)
        .values(insert as InsertUser)
        .returning();
      return created;
    } catch (error) {
      this.log.error(error);
      throw new HttpException('Failed to create user', HttpStatus.BAD_REQUEST);
    }
  }

  async getAll(): Promise<SelectUser[]> {
    return db.select().from(users);
  }

  async getOneByGithubId(_githubId: string): Promise<SelectUser | null> {
    return null; // schema no longer contains githubId
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

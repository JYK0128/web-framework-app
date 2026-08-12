import { type ObjectQuery } from '@mikro-orm/core';
import { Controller, Get, HttpStatus, Inject, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApplicationError } from '@pkg/shared/common';

import { Permission } from '#/common/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { AppEntityManager } from '#/database/entity-manager';
import { User } from '#/entities/auth/user.entity';

import { GetUsersRequestDto, GetUsersResponseDto, UserItemDto } from './dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    @Inject(AppEntityManager)
    private readonly em: AppEntityManager,
  ) {}

  @Permission('user:read')
  @Get()
  @SwaggerApiResponse(GetUsersResponseDto)
  async getUsers(@Query() query: GetUsersRequestDto): Promise<GetUsersResponseDto> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 10));

    const where: ObjectQuery<User> = {};
    const filters: ObjectQuery<User>[] = [];

    if (query.role) {
      filters.push({ role: query.role as User['role'] });
    }

    const search = query.search?.trim();
    if (search) {
      filters.push({
        $or: [
          { name: { $like: `%${search}%` } },
          { email: { $like: `%${search.toLowerCase()}%` } },
        ],
      });
    }

    if (filters.length > 0) {
      where.$and = filters;
    }

    const pageResult = await this.em.findByPage(User, where, {
      page,
      limit,
      orderBy: { createdAt: 'DESC' },
    });

    const items: UserItemDto[] = pageResult.items.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role ?? 'user',
      twoFactorEnabled: u.twoFactorEnabled,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    }));

    return {
      ...pageResult,
      items,
    };
  }

  @Permission('user:read')
  @Get(':id')
  @SwaggerApiResponse(UserItemDto)
  async getUserById(@Param('id') id: string): Promise<UserItemDto> {
    const u = await this.em.findOne(User, { id });
    if (!u) {
      throw new ApplicationError({ code: 'USER_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }

    return {
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role ?? 'user',
      twoFactorEnabled: u.twoFactorEnabled,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    };
  }
}

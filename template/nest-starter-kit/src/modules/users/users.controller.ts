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
    const pageResult = await this.em.findByPage(User, query.toFilterQuery(), query.toPageOptions());

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

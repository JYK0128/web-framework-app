import { Controller, Get, HttpStatus, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApplicationError } from '@pkg/shared/common';

import { PrincipalContext } from '#/common/contexts/principal.context';
import { MachineAuth } from '#/common/decorators/auth-mode.decorator';
import { User } from '#/entities/auth/user.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';

@ApiTags('Internal (Machine)')
@MachineAuth()
@Controller('internal/users')
export class InternalUsersController {
  constructor(
    private readonly em: AppEntityManager,
    private readonly principalContext: PrincipalContext,
  ) {}

  @ApiOperation({ summary: 'Machine: 대고객 회원 목록 조회 (Control Plane 전용)' })
  @Get()
  async listUsers() {
    const principal = this.principalContext.principal;
    if (!principal || principal.type !== 'machine') {
      throw new ApplicationError({
        code: 'AUTHENTICATION_REQUIRED',
        status: HttpStatus.UNAUTHORIZED,
      });
    }
    const users = await this.em.find(
      User,
      {},
      {
        populate: ['role'],
        orderBy: { createdAt: 'DESC' },
        limit: 100,
      },
    );

    return {
      caller: principal.id,
      total: users.length,
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        membership: u.role ? { code: u.role.code, label: u.role.label } : null,
        createdAt: u.createdAt,
      })),
    };
  }

  @ApiOperation({ summary: 'Machine: 대고객 회원 상세 조회 (Control Plane 전용)' })
  @Get(':id')
  async getUser(@Param('id') id: string) {
    const user = await this.em.findOne(User, { id }, { populate: ['role'] });
    if (!user) {
      throw new ApplicationError({
        code: 'USER_NOT_FOUND',
        message: 'User not found in service-api',
        status: HttpStatus.NOT_FOUND,
      });
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      membership: user.role ? { code: user.role.code, label: user.role.label } : null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

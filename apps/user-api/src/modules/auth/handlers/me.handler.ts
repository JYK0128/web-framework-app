import { HttpStatus, Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { User } from '#/entities/auth/user.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { MeResponseDto } from '#/modules/auth/interfaces/me.response.dto';
import { MeQuery } from '#/modules/auth/queries/me.query';

@Injectable()
@QueryHandler(MeQuery)
export class MeHandler implements IQueryHandler<MeQuery, MeResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: MeQuery): Promise<MeResponseDto> {
    const { input } = query;
    const user = await this.em.findOne(
      User,
      { id: input.userId, deletedAt: null },
      { populate: ['role', 'profile'] },
    );

    if (!user || user.isBanned || user.isLocked) {
      throw new ApplicationError({
        code: 'USER_NOT_FOUND',
        status: HttpStatus.NOT_FOUND,
        message: '사용자 정보를 찾을 수 없습니다.',
      });
    }

    if (!user.role) {
      throw new ApplicationError({
        code: 'ROLE_NOT_ASSIGNED',
        status: HttpStatus.FORBIDDEN,
        message: '사용자에게 역할이 할당되어 있지 않습니다.',
      });
    }

    return MeResponseDto.fromPlain<MeResponseDto>({
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      employeeNo: user.profile?.employeeNo ?? null,
      department: user.profile?.department ?? null,
      phoneNumber: user.profile?.phoneNumber ?? null,
      twoFactorEnabled: user.twoFactorEnabled,
      roleCode: user.role.code,
      permissions: user.role.permissions ?? [],
      lastLoginAt: user.metadata?.lastLoginAt ? new Date(user.metadata.lastLoginAt).toISOString() : null,
    });
  }
}

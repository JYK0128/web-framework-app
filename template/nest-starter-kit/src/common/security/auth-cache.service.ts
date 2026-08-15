import { type EntityDTO, wrap } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

import { RedisService } from '#/common/redis/redis.service';
import { AppEntityManager } from '#/database/entity-manager';
import { Role, type RoleName, type RolePermissions } from '#/entities/auth.extentions/role.entity';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';

export type CachedUserState = EntityDTO<User> & {
  passwordUpdatedAt: string | null
};

const USER_STATE_TTL_SECONDS = 10 * 60; // 10분
const ROLE_PERMISSIONS_TTL_SECONDS = 60 * 60; // 1시간

@Injectable()
export class AuthCacheService {
  constructor(
    private readonly redis: RedisService,
    private readonly em: AppEntityManager,
  ) {}

  private userKey(userId: string): string {
    return `auth:user:${userId}`;
  }

  private blacklistKey(jti: string): string {
    return `auth:blacklist:${jti}`;
  }

  private roleKey(roleName: string): string {
    return `auth:role:${roleName}`;
  }

  /**
   * 유저 상태 조회 (Redis 우선, 캐시 미스 시 RDB 조회 후 캐싱)
   */
  async getUserState(userId: string): Promise<CachedUserState | null> {
    const cached = await this.redis.get<CachedUserState>(this.userKey(userId));
    if (cached) return cached;

    // 캐시 미스: RDB 1회 조회
    const user = await this.em.findOne(User, { id: userId }, { filters: false });
    if (!user) return null;

    const account = await this.em.findOne(Account, {
      user: userId,
      providerId: 'credential',
    }, { filters: false });

    const userPojo = wrap(user).toPOJO();
    const state: CachedUserState = {
      ...userPojo,
      passwordUpdatedAt: account?.metadata?.passwordUpdatedAt ? new Date(account.metadata.passwordUpdatedAt).toISOString() : null,
    };

    await this.redis.set(this.userKey(userId), state, USER_STATE_TTL_SECONDS);
    return state;
  }

  /**
   * 유저 상태 캐시 무효화 (Ban, 권한 변경, 탈퇴, 비번 변경 시 호출)
   */
  async invalidateUserState(userId: string): Promise<void> {
    await this.redis.del(this.userKey(userId));
  }

  /**
   * 토큰 블랙리스트 등록 (로그아웃 시)
   */
  async blacklistToken(jti: string, ttlSeconds: number): Promise<void> {
    if (ttlSeconds > 0) {
      await this.redis.set(this.blacklistKey(jti), '1', ttlSeconds);
    }
  }

  /**
   * 토큰이 블랙리스트에 등록되어 있는지 확인
   */
  async isTokenBlacklisted(jti: string): Promise<boolean> {
    return this.redis.exists(this.blacklistKey(jti));
  }

  /**
   * 역할별 권한 조회 (Redis 우선, 캐시 미스 시 RDB 1회 조회)
   */
  async getRolePermissions(roleName: RoleName): Promise<RolePermissions | null> {
    const cached = await this.redis.get<RolePermissions>(this.roleKey(roleName));
    if (cached) return cached;

    const role = await this.em.findOne(Role, { name: roleName });
    if (!role) return null;

    await this.redis.set(this.roleKey(roleName), role.permissions, ROLE_PERMISSIONS_TTL_SECONDS);
    return role.permissions;
  }

  /**
   * 역할 권한 캐시 무효화 (권한 수정 시 호출)
   */
  async invalidateRolePermissions(roleName: RoleName): Promise<void> {
    await this.redis.del(this.roleKey(roleName));
  }
}

import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { decrypt } from '@pkg/shared/server';

import { EntityResponseDto } from '#/common/interfaces/response/entity.response.dto';
import { type Role } from '#/entities/auth.extensions/role.entity';
import { Account } from '#/entities/auth/account.entity';
import { type Profile } from '#/entities/auth/profile.entity';
import { User } from '#/entities/auth/user.entity';
import { env } from '#/env';

@ApiSchema({ name: 'MeResponse' })
export class MeResponseDto extends EntityResponseDto(User) {
  @ApiProperty({ type: String, example: 'usr_01J23456789ABCDEF', description: '사용자 고유 식별자' })
  override id!: string;

  @ApiProperty({ type: String, example: 'user@company.com', description: '사용자 이메일' })
  email!: string;

  @ApiProperty({ type: Boolean, description: '이메일 인증 여부' })
  override emailVerified!: boolean;

  @ApiProperty({ type: String, example: '홍길동', description: '사용자 이름' })
  name!: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'https://cdn.company.com/avatars/user.png', description: '프로필 아바타 이미지' })
  image?: string | null;

  @ApiProperty({ type: String, nullable: true, example: '010-1234-5678', description: '연락처' })
  phoneNumber!: string | null;

  @ApiProperty({ type: Boolean, example: false, description: '2단계 인증(2FA) 활성화 여부' })
  override twoFactorEnabled!: boolean;

  @ApiProperty({ type: Boolean, description: '본인인증 완료 여부' })
  phoneNumberVerified!: boolean;

  @ApiProperty({ type: Boolean, description: '현재 app.config.ts 비밀번호 정책에 따른 만료 여부' })
  passwordExpired!: boolean;

  @ApiProperty({ type: String, example: 'super_admin', description: '역할 코드' })
  roleCode!: string;

  @ApiProperty({ type: String, example: '회원', description: '역할 표시명' })
  roleLabel!: string;

  @ApiProperty({ type: [String], example: ['qna:read', 'qna:update'], description: '보유 권한 목록' })
  permissions!: string[];

  @ApiProperty({ type: [String], example: ['credential', 'google'], description: '연결된 로그인 제공자 목록' })
  providers!: string[];

  @ApiProperty({ type: Date, nullable: true, description: '비밀번호 변경일' })
  passwordUpdatedAt!: Date | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: '2026-09-18T00:00:00.000Z', description: '최근 로그인 일시' })
  lastLoginAt?: string | null;

  static override from(user: User, profile: Profile, role: Role, accounts: Account[], passwordExpired: boolean): MeResponseDto {
    const credentialAccount = accounts.find((account) => account.providerId === Account.PROVIDER_CREDENTIAL);
    return this.fromPlain({
      id: user.id,
      email: decrypt(profile.emailEncrypted, env.PII_ENCRYPTION_KEY),
      emailVerified: Boolean(user.emailVerified),
      name: profile.name,
      image: profile.image,
      phoneNumber: profile.phoneNumberEncrypted ? decrypt(profile.phoneNumberEncrypted, env.PII_ENCRYPTION_KEY) : null,
      twoFactorEnabled: user.twoFactorEnabled,
      phoneNumberVerified: user.phoneNumberVerified,
      providers: [...new Set(accounts.map((account) => account.providerId))],
      passwordUpdatedAt: credentialAccount?.metadata?.passwordUpdatedAt ?? null,
      passwordExpired,
      roleCode: role.code,
      roleLabel: role.label ?? '',
      permissions: role.permissions ?? [],
      lastLoginAt: user.metadata?.lastLoginAt ? new Date(user.metadata.lastLoginAt).toISOString() : null,
    });
  }
}

import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';

import { EntityDto } from '#/common/dto/entity-dto';
import { User } from '#/entities/auth/user.entity';

@ApiSchema({ name: 'MeResponse' })
export class MeResponseDto extends EntityDto(User) {
  @ApiProperty({ type: String, example: 'usr_01J23456789ABCDEF', description: '관리자 고유 식별자' })
  override id!: string;

  @ApiProperty({ type: String, example: 'admin@company.com', description: '관리자 이메일' })
  override email!: string;

  @ApiProperty({ type: String, example: '홍길동', description: '관리자 이름' })
  override name!: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'https://cdn.company.com/avatars/admin.png', description: '프로필 아바타 이미지' })
  override image?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'EMP1024', description: '사원 번호' })
  employeeNo?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: '플랫폼개발팀', description: '소속 부서' })
  department?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: '010-1234-5678', description: '연락처' })
  phoneNumber?: string | null;

  @ApiProperty({ type: Boolean, example: false, description: '2단계 인증(2FA) 활성화 여부' })
  override twoFactorEnabled!: boolean;

  @ApiProperty({ type: String, example: 'super_admin', description: '역할 코드' })
  roleCode!: string;

  @ApiProperty({ type: [String], example: ['qna:read', 'qna:update'], description: '보유 권한 목록' })
  permissions!: string[];

  @ApiPropertyOptional({ type: String, nullable: true, example: '2026-09-18T00:00:00.000Z', description: '최근 로그인 일시' })
  lastLoginAt?: string | null;
}

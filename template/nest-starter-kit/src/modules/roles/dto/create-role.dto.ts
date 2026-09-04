import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

import { DtoType } from '#/common/dto/entity-dto';
import { Role, type RolePermissions } from '#/entities/auth.extentions/role.entity';

import { RoleDto } from './role.dto';

export class CreateRoleRequestDto extends DtoType(Role) {
  @ApiProperty({
    type: 'string',
    maxLength: 50,
    example: 'manager',
    description: '영문 소문자, 숫자, 대시(-), 언더스코어(_)로 구성된 고유 역할 코드',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  @Matches(/^[a-z0-9_-]+$/, {
    message: '역할 코드는 영문 소문자, 숫자, 하이픈(-), 언더스코어(_)만 사용할 수 있습니다.',
  })
  override key!: string;

  @ApiProperty({ type: 'string', maxLength: 100, example: '운영 매니저' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  override label!: string;

  @ApiPropertyOptional({ type: 'string', maxLength: 255, example: '공지사항 및 문의 관리 운영 권한' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  override description?: string;

  @ApiPropertyOptional({
    type: 'string',
    description: '기존 역할의 권한을 복제하여 생성할 경우 원본 역할의 ID',
  })
  @IsOptional()
  @IsString()
  copyFromRoleId?: string;

  @ApiPropertyOptional({ type: 'object', additionalProperties: { type: 'array', items: { type: 'string' } } })
  @IsOptional()
  @IsObject()
  override permissions?: RolePermissions;
}

export class CreateRoleResponseDto extends RoleDto {}

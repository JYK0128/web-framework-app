import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

import { DtoType } from '#/common/dto/entity-dto';
import { Resource } from '#/entities/auth.extentions/resource.entity';

import { ResourceDto } from './resource.dto';

export class CreateResourceRequestDto extends DtoType(Resource) {
  @ApiProperty({ maxLength: 50, example: 'reports', description: '영문 소문자, 숫자, 하이픈(-), 언더스코어(_)로 구성된 고유 리소스 코드' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  @Matches(/^[a-z0-9_-]+$/, {
    message: '리소스 코드는 영문 소문자, 숫자, 하이픈(-), 언더스코어(_)만 사용할 수 있습니다.',
  })
  override key!: string;

  @ApiProperty({ maxLength: 100, example: '리포트' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  override label!: string;

  @ApiPropertyOptional({ maxLength: 255, example: '리포트 조회 및 관리 기능' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  override description?: string;

  @ApiProperty({ type: 'array', items: { type: 'string' }, example: ['read', 'approve', 'publish'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  override actions!: string[];
}

export class CreateResourceResponseDto extends ResourceDto {}

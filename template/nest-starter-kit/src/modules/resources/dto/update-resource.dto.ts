import { ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

import { DtoType } from '#/common/dto/entity-dto';
import { Resource } from '#/entities/auth.extentions/resource.entity';

import { ResourceDto } from './resource.dto';

export class UpdateResourceRequestDto extends DtoType(Resource) {
  @ApiPropertyOptional({ maxLength: 100, example: '리포트' })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  override label?: string;

  @ApiPropertyOptional({ maxLength: 255, example: '리포트 조회 및 승인 기능' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  override description?: string;

  @ApiPropertyOptional({ type: 'array', items: { type: 'string' }, example: ['read', 'approve'] })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  override actions?: string[];
}

export class UpdateResourceResponseDto extends ResourceDto {}

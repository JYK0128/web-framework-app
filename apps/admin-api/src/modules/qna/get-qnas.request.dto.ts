import { ApiPropertyOptional } from '@nestjs/swagger';
import { PageRequestDto } from '@pkg/server-core/http/dto/request/page.request.dto';
import { QnaPriority, QnaStatus } from '@pkg/shared/constants';
import { IsEnum, IsIn, IsOptional } from 'class-validator';

import type { BaseEntity } from '#/core/database/entities/base.entity';

export class GetQnasRequestDto extends PageRequestDto<BaseEntity, 'createdAt' | 'updatedAt'> {
  @ApiPropertyOptional({ isArray: true, enum: ['createdAt', 'updatedAt'] })
  @IsIn(['createdAt', 'updatedAt'], { each: true })
  override sort: ('createdAt' | 'updatedAt')[] = ['createdAt'];

  @ApiPropertyOptional({ enum: QnaStatus }) @IsOptional() @IsEnum(QnaStatus) status?: QnaStatus;
  @ApiPropertyOptional({ enum: QnaPriority }) @IsOptional() @IsEnum(QnaPriority) priority?: QnaPriority;
}

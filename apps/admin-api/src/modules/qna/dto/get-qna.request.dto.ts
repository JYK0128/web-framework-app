import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional } from 'class-validator';

import type { BaseEntity } from '#/core/database/entities/common/base.entity';
import { PageRequestDto } from '#/core/http/dto/request/page.request.dto';
import { QnaPriority, QnaStatus } from '#/modules/qna/dto/qna.constants';

export class GetQnaRequestDto extends PageRequestDto<BaseEntity, 'createdAt' | 'updatedAt'> {
  @ApiPropertyOptional({ isArray: true, enum: ['createdAt', 'updatedAt'] })
  @IsIn(['createdAt', 'updatedAt'], { each: true })
  override sort: ('createdAt' | 'updatedAt')[] = ['createdAt'];

  @ApiPropertyOptional({ enum: QnaStatus }) @IsOptional() @IsEnum(QnaStatus) status?: QnaStatus;
  @ApiPropertyOptional({ enum: QnaPriority }) @IsOptional() @IsEnum(QnaPriority) priority?: QnaPriority;
}

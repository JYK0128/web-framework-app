import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

import { EntityDto } from '#/common/dto/entity-dto';
import { NoticeRead } from '#/entities/notices/notice-read.entity';

export class MarkNoticeReadRequestDto extends EntityDto(NoticeRead) {
  @ApiProperty({ type: 'string' })
  @IsString()
  override id!: string;
}

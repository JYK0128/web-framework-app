import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

import { DtoType } from '#/common/dto/entity-dto';
import { Notice } from '#/entities/notices/notice.entity';

export class DeleteNoticeRequestDto extends DtoType(Notice) {
  @ApiProperty({ type: 'string' })
  @IsString()
  override id!: string;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { CursorRequestDto } from '@pkg/server-core/http/dto/request';
import { NoticeImportance } from '@pkg/shared/constants';
import { IsEnum, IsOptional } from 'class-validator';

import { Notice } from '~/core/database/entities/notices';

export class GetPublicNoticesRequestDto extends CursorRequestDto<Notice> {
  @ApiPropertyOptional({ enum: NoticeImportance }) @IsOptional() @IsEnum(NoticeImportance) importance?: NoticeImportance;
  override get searchFields(): (keyof Notice)[] { return ['title', 'content']; }
}

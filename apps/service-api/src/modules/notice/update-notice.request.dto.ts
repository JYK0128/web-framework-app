import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { NoticeImportance } from '@pkg/shared/constants';
import { IsBoolean, IsEnum, ValidateIf } from 'class-validator';

import { CreateNoticeRequestDto } from '~/modules/notice/create-notice.request.dto';

export class UpdateNoticeRequestDto extends PartialType(OmitType(CreateNoticeRequestDto, ['importance', 'isPinned'] as const), { skipNullProperties: false }) {
  static readonly richTextFields = ['content'];

  @ApiPropertyOptional({ enum: NoticeImportance })
  @ValidateIf((_object, value) => value !== undefined)
  @IsEnum(NoticeImportance)
  importance?: NoticeImportance;

  @ApiPropertyOptional({ type: Boolean })
  @ValidateIf((_object, value) => value !== undefined)
  @IsBoolean()
  isPinned?: boolean;
}

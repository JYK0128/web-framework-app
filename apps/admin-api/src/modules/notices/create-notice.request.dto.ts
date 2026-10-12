import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';

import { BaseDto } from '#/core/http/dto/base/base.dto';
import { NOTICE_IMPORTANCE, PUBLICATION_STATUS } from '#/modules/notices/notices.constants';

export class CreateNoticeRequestDto extends BaseDto {
  static readonly richTextFields = ['content'];
  @ApiProperty({ maxLength: 255 }) @IsString() @IsNotEmpty() @MaxLength(255) title!: string;
  @ApiProperty() @IsString() @IsNotEmpty() content!: string;
  @ApiProperty({ enum: NOTICE_IMPORTANCE }) @IsIn(NOTICE_IMPORTANCE) importance: typeof NOTICE_IMPORTANCE[number] = 'normal';
  @ApiProperty({ type: Boolean, default: false }) @IsBoolean() isPinned = false;
  @ApiProperty({ enum: PUBLICATION_STATUS }) @IsIn(PUBLICATION_STATUS) status: typeof PUBLICATION_STATUS[number] = 'draft';
}

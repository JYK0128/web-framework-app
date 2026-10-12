import { ApiProperty } from '@nestjs/swagger';

import { BaseDto } from '#/core/http/dto/base/base.dto';

export class NoticeActionResponseDto extends BaseDto { @ApiProperty() ok!: boolean; }

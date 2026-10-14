import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base/base.dto';
import { IsEnum, ValidateIf } from 'class-validator';

import { SupportRoomStatus } from '#/modules/support/support.constants';

export class UpdateSupportRoomRequestDto extends BaseDto { @ApiPropertyOptional({ enum: SupportRoomStatus }) @ValidateIf((_object, value) => value !== undefined) @IsEnum(SupportRoomStatus) status?: SupportRoomStatus; }

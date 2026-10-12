import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

import { BaseDto } from '#/core/http/dto/base/base.dto';
import { SupportRoomStatus } from '#/modules/support/support.constants';

export class UpdateSupportRoomRequestDto extends BaseDto { @ApiPropertyOptional({ enum: SupportRoomStatus }) @IsOptional() @IsEnum(SupportRoomStatus) status?: SupportRoomStatus; }

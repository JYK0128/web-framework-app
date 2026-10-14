import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, ValidateIf } from 'class-validator';

import { SupportRoomStatus } from '#/core/database/entities/support';

export class UpdateSupportRoomRequestDto {
  @ApiPropertyOptional({ enum: SupportRoomStatus }) @ValidateIf((_object, value) => value !== undefined) @IsEnum(SupportRoomStatus) status?: SupportRoomStatus;
}

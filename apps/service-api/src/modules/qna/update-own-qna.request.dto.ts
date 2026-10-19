import { ApiPropertyOptional } from '@nestjs/swagger';
import { QnaStatus } from '@pkg/shared/constants';
import { IsEnum, ValidateIf } from 'class-validator';

export class UpdateOwnQnaRequestDto {
  @ApiPropertyOptional({ enum: QnaStatus }) @ValidateIf((_object, value) => value !== undefined) @IsEnum(QnaStatus) status?: QnaStatus;
}

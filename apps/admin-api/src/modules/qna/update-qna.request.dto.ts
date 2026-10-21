import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base';
import { QnaPriority, QnaStatus } from '@pkg/shared/constants';
import { IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';

export class UpdateQnaRequestDto extends BaseDto { @ApiPropertyOptional({ enum: QnaStatus }) @ValidateIf((_object, value) => value !== undefined) @IsEnum(QnaStatus) status?: QnaStatus; @ApiPropertyOptional({ enum: QnaPriority }) @ValidateIf((_object, value) => value !== undefined) @IsEnum(QnaPriority) priority?: QnaPriority; @ApiPropertyOptional() @ValidateIf((_object, value) => value !== undefined) @IsString() answer?: string; @ApiPropertyOptional() @IsOptional() @IsString() assigneeId?: string | null; }

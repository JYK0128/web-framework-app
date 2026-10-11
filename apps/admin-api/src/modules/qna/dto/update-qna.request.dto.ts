import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

import { BaseDto } from '#/core/http/dto/base/base.dto';
import { QnaPriority, QnaStatus } from '#/modules/qna/dto/qna.constants';

export class UpdateQnaRequestDto extends BaseDto { @ApiPropertyOptional({ enum: QnaStatus }) @IsOptional() @IsEnum(QnaStatus) status?: QnaStatus; @ApiPropertyOptional({ enum: QnaPriority }) @IsOptional() @IsEnum(QnaPriority) priority?: QnaPriority; @ApiPropertyOptional() @IsOptional() @IsString() answer?: string; @ApiPropertyOptional() @IsOptional() @IsString() assigneeId?: string | null; }

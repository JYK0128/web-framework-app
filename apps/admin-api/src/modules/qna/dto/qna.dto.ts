import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

import { ToNumber } from '#/common/decorators/to-number.decorator';

export const QnaStatus = { OPEN: 'open', IN_PROGRESS: 'in_progress', ANSWERED: 'answered', CLOSED: 'closed' } as const;
export type QnaStatus = (typeof QnaStatus)[keyof typeof QnaStatus];
export const QnaPriority = { LOW: 'low', NORMAL: 'normal', HIGH: 'high', URGENT: 'urgent' } as const;
export type QnaPriority = (typeof QnaPriority)[keyof typeof QnaPriority];

@ApiSchema({ name: 'QnaItem' })
export class QnaItemDto { @ApiProperty() id!: string; @ApiProperty() category!: string; @ApiProperty() title!: string; @ApiProperty() content!: string; @ApiProperty({ enum: QnaPriority }) priority!: QnaPriority; @ApiProperty({ enum: QnaStatus }) status!: QnaStatus; @ApiPropertyOptional({ nullable: true }) answer!: string | null; @ApiProperty() userId!: string; @ApiProperty() userName!: string; @ApiPropertyOptional({ nullable: true }) assigneeName!: string | null; @ApiProperty() createdAt!: Date; @ApiProperty() updatedAt!: Date; }
export class GetQnaRequestDto { @ApiPropertyOptional() @IsOptional() @IsString() search?: string; @ApiPropertyOptional() @IsOptional() @ToNumber() @IsInt() @Min(1) page = 1; @ApiPropertyOptional() @IsOptional() @ToNumber() @IsInt() @Min(1) @Max(100) limit = 20; @ApiPropertyOptional({ enum: QnaStatus }) @IsOptional() @IsEnum(QnaStatus) status?: QnaStatus; @ApiPropertyOptional({ enum: QnaPriority }) @IsOptional() @IsEnum(QnaPriority) priority?: QnaPriority; }
export class QnaListResponseDto { @ApiProperty({ type: [QnaItemDto] }) items!: QnaItemDto[]; @ApiProperty() page!: number; @ApiProperty() totalPages!: number; @ApiProperty() hasNextPage!: boolean; @ApiProperty() hasPrevPage!: boolean; @ApiProperty() totalCount!: number; }
export class UpdateQnaRequestDto { @ApiPropertyOptional({ enum: QnaStatus }) @IsOptional() @IsEnum(QnaStatus) status?: QnaStatus; @ApiPropertyOptional({ enum: QnaPriority }) @IsOptional() @IsEnum(QnaPriority) priority?: QnaPriority; @ApiPropertyOptional() @IsOptional() @IsString() answer?: string; @ApiPropertyOptional() @IsOptional() @IsString() assigneeId?: string | null; }
export class QnaActionResponseDto { @ApiProperty() success!: boolean; }

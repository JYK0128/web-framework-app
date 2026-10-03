import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

import { PAGINATION_DEFAULT_LIMIT, PAGINATION_DEFAULT_PAGE, PAGINATION_MAX_LIMIT } from '#/app.config';
import { ToNumber } from '#/common/decorators/to-number.decorator';
import { OkResponseDto, PageResponseDto } from '#/common/interfaces/response';

export const QnaStatus = { OPEN: 'open', IN_PROGRESS: 'in_progress', ANSWERED: 'answered', CLOSED: 'closed' } as const;
export type QnaStatus = (typeof QnaStatus)[keyof typeof QnaStatus];
export const QnaPriority = { LOW: 'low', NORMAL: 'normal', HIGH: 'high', URGENT: 'urgent' } as const;
export type QnaPriority = (typeof QnaPriority)[keyof typeof QnaPriority];

@ApiSchema({ name: 'QnaItem' })
export class QnaItemDto { @ApiProperty() id!: string; @ApiProperty() category!: string; @ApiProperty() title!: string; @ApiProperty() content!: string; @ApiProperty({ enum: QnaPriority }) priority!: QnaPriority; @ApiProperty({ enum: QnaStatus }) status!: QnaStatus; @ApiPropertyOptional({ nullable: true }) answer!: string | null; @ApiProperty() userId!: string; @ApiProperty() userName!: string; @ApiPropertyOptional({ description: '마스킹된 문의자 이메일' }) userEmailMasked?: string; @ApiPropertyOptional({ nullable: true }) assigneeName!: string | null; @ApiProperty() createdAt!: Date; @ApiProperty() updatedAt!: Date; }
export class GetQnaRequestDto { @ApiPropertyOptional() @IsOptional() @IsString() search?: string; @ApiPropertyOptional({ default: PAGINATION_DEFAULT_PAGE }) @IsOptional() @ToNumber() @IsInt() @Min(1) page = PAGINATION_DEFAULT_PAGE; @ApiPropertyOptional({ maximum: PAGINATION_MAX_LIMIT, default: PAGINATION_DEFAULT_LIMIT }) @IsOptional() @ToNumber() @IsInt() @Min(1) @Max(PAGINATION_MAX_LIMIT) limit = PAGINATION_DEFAULT_LIMIT; @ApiPropertyOptional({ enum: QnaStatus }) @IsOptional() @IsEnum(QnaStatus) status?: QnaStatus; @ApiPropertyOptional({ enum: QnaPriority }) @IsOptional() @IsEnum(QnaPriority) priority?: QnaPriority; }
export class QnaPageResponseDto extends PageResponseDto<QnaItemDto> { @ApiProperty({ type: [QnaItemDto] }) @Type(() => QnaItemDto) override items!: QnaItemDto[]; }
export class UpdateQnaRequestDto { @ApiPropertyOptional({ enum: QnaStatus }) @IsOptional() @IsEnum(QnaStatus) status?: QnaStatus; @ApiPropertyOptional({ enum: QnaPriority }) @IsOptional() @IsEnum(QnaPriority) priority?: QnaPriority; @ApiPropertyOptional() @IsOptional() @IsString() answer?: string; @ApiPropertyOptional() @IsOptional() @IsString() assigneeId?: string | null; }
export class QnaActionResponseDto extends OkResponseDto {}

import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';

import { PageRequestDto } from '#/common/interfaces/request';
import { OkResponseDto, PageResponseDto } from '#/common/interfaces/response';
import type { BaseEntity } from '#/entities/common/base.entity';

export const QnaStatus = { OPEN: 'open', IN_PROGRESS: 'in_progress', ANSWERED: 'answered', CLOSED: 'closed' } as const;
export type QnaStatus = (typeof QnaStatus)[keyof typeof QnaStatus];
export const QnaPriority = { LOW: 'low', NORMAL: 'normal', HIGH: 'high', URGENT: 'urgent' } as const;
export type QnaPriority = (typeof QnaPriority)[keyof typeof QnaPriority];

@ApiSchema({ name: 'QnaItem' })
export class QnaItemDto { @ApiProperty() id!: string; @ApiProperty() category!: string; @ApiProperty() title!: string; @ApiProperty() content!: string; @ApiProperty({ enum: QnaPriority }) priority!: QnaPriority; @ApiProperty({ enum: QnaStatus }) status!: QnaStatus; @ApiPropertyOptional({ nullable: true }) answer!: string | null; @ApiProperty() userId!: string; @ApiProperty() userName!: string; @ApiPropertyOptional({ description: '마스킹된 문의자 이메일' }) userEmailMasked?: string; @ApiPropertyOptional({ nullable: true }) assigneeName!: string | null; @ApiProperty() createdAt!: Date; @ApiProperty() updatedAt!: Date; }
export class GetQnaRequestDto extends PageRequestDto<BaseEntity, 'createdAt' | 'updatedAt'> {
  @ApiPropertyOptional({ isArray: true, enum: ['createdAt', 'updatedAt'] })
  @IsIn(['createdAt', 'updatedAt'], { each: true })
  override sort: ('createdAt' | 'updatedAt')[] = ['createdAt'];

  @ApiPropertyOptional({ enum: QnaStatus }) @IsOptional() @IsEnum(QnaStatus) status?: QnaStatus;
  @ApiPropertyOptional({ enum: QnaPriority }) @IsOptional() @IsEnum(QnaPriority) priority?: QnaPriority;
}
export class QnaPageResponseDto extends PageResponseDto<QnaItemDto> { @ApiProperty({ type: [QnaItemDto] }) @Type(() => QnaItemDto) override items!: QnaItemDto[]; }
export class UpdateQnaRequestDto { @ApiPropertyOptional({ enum: QnaStatus }) @IsOptional() @IsEnum(QnaStatus) status?: QnaStatus; @ApiPropertyOptional({ enum: QnaPriority }) @IsOptional() @IsEnum(QnaPriority) priority?: QnaPriority; @ApiPropertyOptional() @IsOptional() @IsString() answer?: string; @ApiPropertyOptional() @IsOptional() @IsString() assigneeId?: string | null; }
export class QnaActionResponseDto extends OkResponseDto {}

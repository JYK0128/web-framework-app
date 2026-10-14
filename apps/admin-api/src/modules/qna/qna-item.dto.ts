import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base/base.dto';
import { QnaPriority, QnaStatus } from '@pkg/shared/constants';

@ApiSchema({ name: 'QnaItem' })
export class QnaItemDto extends BaseDto { @ApiProperty() id!: string; @ApiProperty() category!: string; @ApiProperty() title!: string; @ApiProperty() content!: string; @ApiProperty({ enum: QnaPriority }) priority!: QnaPriority; @ApiProperty({ enum: QnaStatus }) status!: QnaStatus; @ApiPropertyOptional({ nullable: true }) answer!: string | null; @ApiProperty() userId!: string; @ApiProperty() userName!: string; @ApiPropertyOptional({ description: '마스킹된 문의자 이메일' }) userEmailMasked?: string; @ApiPropertyOptional({ nullable: true }) assigneeName!: string | null; @ApiProperty() createdAt!: Date; @ApiProperty() updatedAt!: Date; }

import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

import { MaskEmail } from '#/common/decorators/mask-email.decorator';
import { MaskName } from '#/common/decorators/mask-name.decorator';
import { EntityDto } from '#/common/dto/entity-dto';
import { PageRequestDto } from '#/common/interfaces/request/page.request.dto';
import { PageResponseDto } from '#/common/interfaces/response/page.response.dto';
import { Qna, QnaCategory, QnaPriority, QnaStatus } from '#/entities/qna/qna.entity';

@ApiSchema({ name: 'QnaItem' })
export class QnaItemDto extends EntityDto(Qna) {
  @ApiProperty() override id!: string;
  @ApiProperty({ enum: QnaCategory }) override category!: QnaCategory;
  @ApiProperty() override title!: string;
  @ApiProperty() override content!: string;
  @ApiProperty({ enum: QnaPriority }) override priority!: QnaPriority;
  @ApiProperty({ enum: QnaStatus }) override status!: QnaStatus;
  @ApiPropertyOptional({ nullable: true }) override answer!: string | null;
  @ApiProperty() userId!: string;
  @ApiProperty() @MaskName() userName!: string;
  @ApiPropertyOptional({ description: '마스킹된 문의자 이메일' }) @MaskEmail() userEmailMasked?: string;
  @ApiPropertyOptional({ nullable: true }) assigneeName!: string | null;
  @ApiProperty() override createdAt!: Date;
  @ApiProperty() override updatedAt!: Date;
}

export class CreateQnaRequestDto {
  @ApiProperty({ enum: QnaCategory }) @IsEnum(QnaCategory) category!: QnaCategory;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(255) title!: string;
  @ApiProperty() @IsString() @IsNotEmpty() content!: string;
  @ApiPropertyOptional({ enum: QnaPriority }) @IsOptional() @IsEnum(QnaPriority) priority?: QnaPriority;
}

export class UpdateQnaRequestDto {
  @ApiPropertyOptional({ enum: QnaStatus }) @IsOptional() @IsEnum(QnaStatus) status?: QnaStatus;
  @ApiPropertyOptional({ enum: QnaPriority }) @IsOptional() @IsEnum(QnaPriority) priority?: QnaPriority;
  @ApiPropertyOptional() @IsOptional() @IsString() answer?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() assigneeId?: string | null;
}

export class UpdateOwnQnaRequestDto {
  @ApiPropertyOptional({ enum: QnaStatus }) @IsOptional() @IsEnum(QnaStatus) status?: QnaStatus;
}

export class GetQnaRequestDto extends PageRequestDto<Qna, 'createdAt' | 'updatedAt'> {
  @ApiPropertyOptional({ enum: QnaCategory }) @IsOptional() @IsEnum(QnaCategory) category?: QnaCategory;
  @ApiPropertyOptional({ enum: QnaStatus }) @IsOptional() @IsEnum(QnaStatus) status?: QnaStatus;
  @ApiPropertyOptional({ enum: QnaPriority }) @IsOptional() @IsEnum(QnaPriority) priority?: QnaPriority;
  override get searchFields(): (keyof Qna)[] {
    return ['title', 'content'];
  }

  override toFilterQuery() {
    const query = super.toFilterQuery();
    return {
      $and: [
        query,
        ...(this.category ? [{ category: this.category }] : []),
        ...(this.status ? [{ status: this.status }] : []),
        ...(this.priority ? [{ priority: this.priority }] : []),
      ],
    };
  }
}

export class QnaListResponseDto extends PageResponseDto<QnaItemDto> { @ApiProperty({ type: [QnaItemDto] }) items!: QnaItemDto[]; }
export class QnaActionResponseDto { @ApiProperty() success!: boolean; }

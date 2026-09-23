import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Qna, QnaPriority, QnaStatus } from '#/entities/qna/qna.entity';
import { EntityDto } from '#/common/dto/entity-dto';
import { PageRequestDto } from '#/common/interfaces/request/page.request.dto';
import { PageResponseDto } from '#/common/interfaces/response/page.response.dto';

@ApiSchema({ name: 'QnaItem' })
export class QnaItemDto extends EntityDto(Qna) {
  @ApiProperty() override id!: string;
  @ApiProperty() override category!: string;
  @ApiProperty() override title!: string;
  @ApiProperty() override content!: string;
  @ApiProperty({ enum: QnaPriority }) override priority!: QnaPriority;
  @ApiProperty({ enum: QnaStatus }) override status!: QnaStatus;
  @ApiPropertyOptional({ nullable: true }) override answer!: string | null;
  @ApiProperty() userId!: string;
  @ApiProperty() userName!: string;
  @ApiPropertyOptional({ nullable: true }) assigneeName!: string | null;
  @ApiProperty() override createdAt!: Date;
  @ApiProperty() override updatedAt!: Date;
}

export class CreateQnaRequestDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(50) category!: string;
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
  @ApiPropertyOptional({ enum: QnaStatus }) @IsOptional() @IsEnum(QnaStatus) status?: QnaStatus;
  @ApiPropertyOptional({ enum: QnaPriority }) @IsOptional() @IsEnum(QnaPriority) priority?: QnaPriority;
  override get searchFields(): (keyof Qna)[] { return ['title', 'content', 'category']; }
  override toFilterQuery() { const query = super.toFilterQuery(); return { $and: [query, ...(this.status ? [{ status: this.status }] : []), ...(this.priority ? [{ priority: this.priority }] : [])] }; }
}

export class QnaListResponseDto extends PageResponseDto<QnaItemDto> { @ApiProperty({ type: [QnaItemDto] }) items!: QnaItemDto[]; }
export class QnaActionResponseDto { @ApiProperty() success!: boolean; }

import { HttpStatus } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { ApplicationError } from '@pkg/shared/common';
import { decrypt } from '@pkg/shared/server';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

import { MaskEmail } from '#/common/decorators/mask-email.decorator';
import { MaskName } from '#/common/decorators/mask-name.decorator';
import { EntityDto } from '#/common/interfaces/base/entity.dto';
import { PageRequestDto } from '#/common/interfaces/request/page.request.dto';
import { OkResponseDto, PageResponseDto } from '#/common/interfaces/response';
import { type User } from '#/entities/auth/user.entity';
import { Qna, QnaCategory, QnaPriority, QnaStatus } from '#/entities/qna/qna.entity';
import { env } from '#/env';

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

  static override from(qna: Qna): QnaItemDto {
    const user = qna.user as User | string;
    const assignee = qna.assignee as User | null | string | undefined;
    const userProfile = typeof user === 'string' ? undefined : user.profile;
    const assigneeProfile = typeof assignee === 'object' && assignee ? assignee.profile : undefined;
    if (typeof user !== 'string' && !userProfile) throw new ApplicationError({ code: 'USER_PROFILE_NOT_FOUND', status: HttpStatus.INTERNAL_SERVER_ERROR });
    if (typeof assignee === 'object' && assignee && !assigneeProfile) throw new ApplicationError({ code: 'USER_PROFILE_NOT_FOUND', status: HttpStatus.INTERNAL_SERVER_ERROR });
    return this.fromPlain({
      id: qna.id,
      category: qna.category,
      title: qna.title,
      content: qna.content,
      priority: qna.priority,
      status: qna.status,
      answer: qna.answer ?? null,
      userId: typeof user === 'string' ? user : user.id,
      userName: userProfile?.name ?? '',
      userEmailMasked: userProfile ? decrypt(userProfile.emailEncrypted, env.PII_ENCRYPTION_KEY) : undefined,
      assigneeName: assigneeProfile?.name ?? null,
      createdAt: qna.createdAt,
      updatedAt: qna.updatedAt,
    });
  }
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
  @ApiPropertyOptional({ isArray: true, enum: ['createdAt', 'updatedAt'] })
  @IsIn(['createdAt', 'updatedAt'], { each: true })
  override sort: ('createdAt' | 'updatedAt')[] = ['createdAt'];

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

export class QnaPageResponseDto extends PageResponseDto<QnaItemDto> { @ApiProperty({ type: [QnaItemDto] }) @Type(() => QnaItemDto) override items!: QnaItemDto[]; }
export class QnaActionResponseDto extends OkResponseDto {}

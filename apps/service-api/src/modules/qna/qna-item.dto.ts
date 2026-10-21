import { HttpStatus } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { MaskEmail, MaskName } from '@pkg/server-core/http/decorators';
import { EntityDto } from '@pkg/server-core/http/dto/base';
import { ApplicationError } from '@pkg/shared/common';
import { QnaPriority, QnaStatus } from '@pkg/shared/constants';
import { decrypt } from '@pkg/shared/server';

import { type User } from '~/core/database/entities/auth';
import { Qna, QnaCategory } from '~/core/database/entities/qna';
import { env } from '~/env';

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

  static override parseEntity(qna: Qna): QnaItemDto {
    const user = qna.user as User | string;
    const assignee = qna.assignee as User | null | string | undefined;
    const userProfile = typeof user === 'string' ? undefined : user.profile;
    const assigneeProfile = typeof assignee === 'object' && assignee ? assignee.profile : undefined;
    if (typeof user !== 'string' && !userProfile) throw new ApplicationError({ code: 'USER_PROFILE_NOT_FOUND', status: HttpStatus.INTERNAL_SERVER_ERROR });
    if (typeof assignee === 'object' && assignee && !assigneeProfile) throw new ApplicationError({ code: 'USER_PROFILE_NOT_FOUND', status: HttpStatus.INTERNAL_SERVER_ERROR });
    return this.parse({
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

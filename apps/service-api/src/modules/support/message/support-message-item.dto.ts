import { HttpStatus } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { EntityDto } from '@pkg/server-core/http/dto/base';
import { ApplicationError } from '@pkg/shared/common';

import { User } from '~/core/database/entities/auth';
import { SupportMessage, SupportMessageSenderType, SupportRoom } from '~/core/database/entities/support';

@ApiSchema({ name: 'SupportMessageItem' })
export class SupportMessageItemDto extends EntityDto(SupportMessage) {
  @ApiProperty() id!: string;
  @ApiProperty() roomId!: string;
  @ApiPropertyOptional({ nullable: true }) senderUserId!: string | null;
  @ApiProperty() senderName!: string;
  @ApiProperty({ enum: SupportMessageSenderType }) senderType!: SupportMessageSenderType;
  @ApiProperty() content!: string;
  @ApiPropertyOptional({ nullable: true }) readAt!: Date | null;
  @ApiProperty() createdAt!: Date;

  static override parseEntity(message: SupportMessage): SupportMessageItemDto {
    const room = message.room as SupportRoom | string;
    const sender = message.senderUser as User | string | null | undefined;
    let senderName = message.senderType === SupportMessageSenderType.AGENT ? '상담원' : '시스템';
    if (typeof sender === 'object' && sender) {
      if (!sender.profile) throw new ApplicationError({ code: 'USER_PROFILE_NOT_FOUND', status: HttpStatus.INTERNAL_SERVER_ERROR });
      senderName = sender.profile.name;
    }
    return this.parse({
      id: message.id,
      roomId: typeof room === 'string' ? room : room.id,
      senderUserId: typeof sender === 'string' ? sender : sender?.id ?? null,
      senderName,
      senderType: message.senderType,
      content: message.content,
      readAt: message.readAt ?? null,
      createdAt: message.createdAt,
    });
  }
}

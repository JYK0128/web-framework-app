import { HttpStatus } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { EntityDto } from '@pkg/server-core/http/dto/base';
import { ApplicationError } from '@pkg/shared/common';

import { User } from '~/core/database/entities/auth';
import { SupportRoom, SupportRoomStatus } from '~/core/database/entities/support';

@ApiSchema({ name: 'SupportRoomItem' })
export class SupportRoomItemDto extends EntityDto(SupportRoom) {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiProperty({ enum: SupportRoomStatus }) status!: SupportRoomStatus;
  @ApiProperty() userId!: string;
  @ApiProperty() userName!: string;
  @ApiPropertyOptional({ nullable: true }) assigneeName!: string | null;
  @ApiPropertyOptional({ nullable: true }) lastMessageAt!: Date | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;

  static override parseEntity(room: SupportRoom): SupportRoomItemDto {
    const user = room.user as User | string;
    const assignee = room.assignee as User | string | null | undefined;
    const userProfile = typeof user === 'string' ? undefined : user.profile;
    const assigneeProfile = typeof assignee === 'object' && assignee ? assignee.profile : undefined;
    if (typeof user !== 'string' && !userProfile) throw new ApplicationError({ code: 'USER_PROFILE_NOT_FOUND', status: HttpStatus.INTERNAL_SERVER_ERROR });
    if (typeof assignee === 'object' && assignee && !assigneeProfile) throw new ApplicationError({ code: 'USER_PROFILE_NOT_FOUND', status: HttpStatus.INTERNAL_SERVER_ERROR });
    return this.parse({
      id: room.id,
      title: room.title,
      status: room.status,
      userId: typeof user === 'string' ? user : user.id,
      userName: userProfile?.name ?? '',
      assigneeName: assigneeProfile?.name ?? null,
      lastMessageAt: room.lastMessageAt ?? null,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    });
  }
}

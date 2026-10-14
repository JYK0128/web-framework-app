import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrincipalContext } from '@pkg/server-core/http/contexts/principal.context';

import { SupportRoom } from '#/core/database/entities/support';
import { AppEntityManager } from '#/core/database/entity-manager';
import { GetOwnSupportRoomsQuery } from '#/modules/support/rooms/get-own-support-rooms.query';
import { GetSupportRoomsCursorResponseDto } from '#/modules/support/rooms/get-support-rooms-cursor.response.dto';
import { SupportRoomItemDto } from '#/modules/support/rooms/support-room-item.dto';

@QueryHandler(GetOwnSupportRoomsQuery)
export class GetOwnSupportRoomsHandler implements IQueryHandler<GetOwnSupportRoomsQuery, GetSupportRoomsCursorResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext) {}
  async execute({ input }: GetOwnSupportRoomsQuery): Promise<GetSupportRoomsCursorResponseDto> {
    const user = this.principal.ensureUser();
    const result = await this.em.findByCursor(SupportRoom, {
      where: {
        user: user.id,
        ...(input.status ? { status: input.status } : {}),
        ...(input.search ? { title: { $ilike: `%${input.search}%` } } : {}),
      },
      ...input.toCursorOptions(),
      populate: ['user.profile', 'assignee.profile'],
    });
    return GetSupportRoomsCursorResponseDto.parse({
      items: result.items.map((room) => SupportRoomItemDto.parseEntity(room)),
      startCursor: result.startCursor,
      endCursor: result.endCursor,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
      totalCount: result.totalCount,
    });
  }
}

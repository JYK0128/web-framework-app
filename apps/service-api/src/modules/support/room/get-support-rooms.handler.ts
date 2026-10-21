import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrincipalContext } from '@pkg/server-core/http/contexts';

import { SupportRoom } from '~/core/database/entities/support';
import { AppEntityManager } from '~/core/database/entity-manager';
import { GetSupportRoomsQuery } from '~/modules/support/room/get-support-rooms.query';
import { GetSupportRoomsResponseDto } from '~/modules/support/room/get-support-rooms.response.dto';
import { SupportRoomItemDto } from '~/modules/support/room/support-room-item.dto';

@QueryHandler(GetSupportRoomsQuery)
export class GetSupportRoomsHandler implements IQueryHandler<GetSupportRoomsQuery, GetSupportRoomsResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext) {}
  async execute({ input }: GetSupportRoomsQuery): Promise<GetSupportRoomsResponseDto> {
    const mine = false;
    const user = mine ? this.principal.ensureUser() : null;
    const filters = {
      ...(user ? { user: user.id } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.search ? { $or: [{ title: { $ilike: `%${input.search}%` } }] } : {}),
    };
    const result = await this.em.findByPage(SupportRoom, filters, {
      ...input.toPageOptions(),
      populate: ['user.profile', 'assignee.profile'],
    });
    return GetSupportRoomsResponseDto.parse({
      ...result,
      items: result.items.map((room) => SupportRoomItemDto.parseEntity(room)),
    });
  }
}

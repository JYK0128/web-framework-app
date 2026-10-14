import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserAuth } from '@pkg/server-core/http/decorators/auth-mode.decorator';
import { Permissions } from '@pkg/server-core/http/decorators/permission.decorator';
import { SwaggerApiResponse } from '@pkg/server-core/http/decorators/swagger-api-response.decorator';
import { AdminPermission } from '@pkg/shared';

import { InternalClient } from '#/core/internal-client';
import { GetSupportRoomRequestDto } from '#/modules/support/rooms/get-support-room.request.dto';
import { GetSupportRoomResponseDto } from '#/modules/support/rooms/get-support-room.response.dto';
import { GetSupportRoomPiiListRequestDto } from '#/modules/support/rooms/get-support-room-pii-list.request.dto';
import { GetSupportRoomPiiListResponseDto } from '#/modules/support/rooms/get-support-room-pii-list.response.dto';
import { GetSupportRoomsRequestDto } from '#/modules/support/rooms/get-support-rooms.request.dto';
import { GetSupportRoomsResponseDto } from '#/modules/support/rooms/get-support-rooms.response.dto';
import { UpdateSupportRoomRequestDto } from '#/modules/support/rooms/update-support-room.request.dto';
import { UpdateSupportRoomResponseDto } from '#/modules/support/rooms/update-support-room.response.dto';
import { maskRoom } from '#/modules/support/support-masking';

@ApiTags('support')
@UserAuth()
@Controller('support')
export class SupportRoomsController {
  constructor(private readonly internalClient: InternalClient) {}

  @ApiOperation({ summary: undefined, operationId: 'SupportController_listRooms_v1' })
  @Get('rooms') @Permissions(AdminPermission.support.read) @SwaggerApiResponse(GetSupportRoomsResponseDto)
  async listRooms(@Query() query: GetSupportRoomsRequestDto): Promise<GetSupportRoomsResponseDto> {
    const result = await this.internalClient.fetch<GetSupportRoomsResponseDto>(`/internal/support/rooms?${this.params(query)}`);
    return GetSupportRoomsResponseDto.parse({ ...result, items: result.items.map(maskRoom) });
  }

  @ApiOperation({ summary: '고객지원 상담방 개인정보 원문 목록 조회', operationId: 'SupportController_listRoomPii_v1' })
  @Get('rooms/pii') @Permissions(AdminPermission.support.piiRead) @SwaggerApiResponse(GetSupportRoomPiiListResponseDto)
  listRoomPii(@Query() query: GetSupportRoomPiiListRequestDto): Promise<GetSupportRoomPiiListResponseDto> {
    return this.internalClient.fetch(`/internal/support/rooms?${this.params(query)}`);
  }

  @ApiOperation({ summary: undefined, operationId: 'SupportController_getRoom_v1' })
  @Get('rooms/:roomId') @Permissions(AdminPermission.support.read) @SwaggerApiResponse(GetSupportRoomResponseDto)
  async getRoom(@Param('roomId') roomId: string): Promise<GetSupportRoomResponseDto> {
    const request = GetSupportRoomRequestDto.parse({ roomId }).validate();
    const result = await this.internalClient.fetch<GetSupportRoomResponseDto>(`/internal/support/rooms/${request.roomId}`);
    return maskRoom(result);
  }

  @ApiOperation({ summary: undefined, operationId: 'SupportController_updateRoom_v1' })
  @Patch('rooms/:roomId') @Permissions(AdminPermission.support.update) @SwaggerApiResponse(UpdateSupportRoomResponseDto)
  updateRoom(@Param('roomId') roomId: string, @Body() input: UpdateSupportRoomRequestDto): Promise<UpdateSupportRoomResponseDto> { return this.internalClient.fetch(`/internal/support/rooms/${roomId}`, { method: 'PATCH', body: input }); }

  private params(query: GetSupportRoomsRequestDto): string {
    const params = new URLSearchParams({ page: String(query.page), limit: String(query.limit) });
    for (const field of query.sort) params.append('sort[]', field);
    for (const direction of query.direction) params.append('direction[]', direction);
    if (query.search) params.set('search', query.search);
    if (query.status) params.set('status', query.status);
    return params.toString();
  }
}

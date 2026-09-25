import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Permission } from '@pkg/shared';

import { UserAuth } from '#/common/decorators/auth-mode.decorator';
import { Permissions } from '#/common/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { InternalServiceClient } from '#/infra/auth/machine/internal-service-client.service';

import { CreateSupportMessageRequestDto, GetSupportRoomsRequestDto, SupportMessageItemDto, SupportMessageListResponseDto, SupportRoomItemDto, SupportRoomListResponseDto, UpdateSupportRoomRequestDto } from './dto';

@ApiTags('support') @UserAuth() @Controller('support')
export class SupportController {
  constructor(private readonly internalClient: InternalServiceClient) {}

  @Get('rooms') @Permissions(Permission.support.read) @SwaggerApiResponse(SupportRoomListResponseDto)
  listRooms(@Query() query: GetSupportRoomsRequestDto) { return this.internalClient.fetchServiceApi(`/api/v1/internal/support/rooms?${this.params(query)}`); }

  @Get('rooms/:roomId') @Permissions(Permission.support.read) @SwaggerApiResponse(SupportRoomItemDto)
  getRoom(@Param('roomId') roomId: string) { return this.internalClient.fetchServiceApi(`/api/v1/internal/support/rooms/${roomId}`); }

  @Get('rooms/:roomId/messages') @Permissions(Permission.support.read) @SwaggerApiResponse(SupportMessageListResponseDto)
  listMessages(@Param('roomId') roomId: string) { return this.internalClient.fetchServiceApi(`/api/v1/internal/support/rooms/${roomId}/messages`); }

  @Post('rooms/:roomId/messages') @Permissions(Permission.support.update) @SwaggerApiResponse(SupportMessageItemDto)
  createMessage(@Param('roomId') roomId: string, @Body() input: CreateSupportMessageRequestDto) { return this.internalClient.fetchServiceApi(`/api/v1/internal/support/rooms/${roomId}/messages`, { method: 'POST', body: input }); }

  @Patch('rooms/:roomId') @Permissions(Permission.support.update) @SwaggerApiResponse(SupportRoomItemDto)
  updateRoom(@Param('roomId') roomId: string, @Body() input: UpdateSupportRoomRequestDto) { return this.internalClient.fetchServiceApi(`/api/v1/internal/support/rooms/${roomId}`, { method: 'PATCH', body: input }); }

  private params(query: GetSupportRoomsRequestDto): string {
    const params = new URLSearchParams({ page: String(query.page), limit: String(query.limit) });
    if (query.search) params.set('search', query.search);
    if (query.status) params.set('status', query.status);
    return params.toString();
  }
}
